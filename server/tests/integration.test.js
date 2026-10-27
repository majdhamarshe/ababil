import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';

let mongo;
let app;
let token;
let categoryId;
let productId;

before(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-jwt-signing';
  process.env.CLIENT_URL = 'http://localhost:5173';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
  await User.create({
    email: 'owner@ababil.test',
    passwordHash: await bcrypt.hash('strong-password', 10),
  });
  token = jwt.sign(
    { sub: 'test-owner', role: 'owner', email: 'owner@ababil.test' },
    process.env.JWT_SECRET
  );
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('admin CRUD, public filtering, and server-priced guest order', async () => {
  const denied = await request(app)
    .post('/api/categories')
    .send({ name: 'الساعات' });
  assert.equal(denied.status, 401);

  const category = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'الساعات',
      slug: 'watches',
      description: 'تذكير عملي وأنيق',
    });
  assert.equal(category.status, 201);
  categoryId = category.body.data._id;

  const product = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'ساعة اختبار',
      slug: 'test-watch',
      description: 'ساعة اختبار لتذكير وقت الصلاة.',
      price: 100,
      discountPercent: 10,
      category: categoryId,
      stock: 3,
      isPublished: true,
      featured: true,
      images: [],
      colors: ['أسود'],
      sizes: [],
    });
  assert.equal(product.status, 201);
  productId = product.body.data._id;

  const listing = await request(app).get(
    '/api/products?category=watches&q=ساعة&featured=true'
  );
  assert.equal(listing.status, 200);
  assert.equal(listing.body.meta.total, 1);
  assert.equal(listing.body.data[0].slug, 'test-watch');

  const order = await request(app)
    .post('/api/orders')
    .send({
      customer: {
        name: 'أحمد خالد',
        phone: '0591234567',
        region: 'نابلس',
        notes: 'الرجاء الاتصال قبل الوصول',
      },
      items: [{ productId, quantity: 2, unitPrice: 1 }],
    });
  assert.equal(order.status, 201);
  assert.equal(order.body.data.subtotal, 180);
  assert.equal(order.body.data.deliveryFee, 20);
  assert.equal(order.body.data.total, 200);

  const insufficient = await request(app)
    .post('/api/orders')
    .send({
      customer: {
        name: 'أحمد خالد',
        phone: '0591234567',
        region: 'نابلس',
        notes: 'الرجاء الاتصال قبل الوصول',
      },
      items: [{ productId, quantity: 2 }],
    });
  assert.equal(insufficient.status, 409);

  const variantProduct = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'قميص متعدد الخيارات',
      slug: 'variant-shirt',
      description: 'قميص اختبار للمقاسات والألوان والمخزون المنفصل.',
      price: 80,
      category: categoryId,
      stock: 999,
      isPublished: true,
      images: [],
      colors: ['أسود', 'أحمر'],
      sizes: ['M', 'L'],
      variants: [
        { color: 'أسود', size: 'M', stock: 1 },
        { color: 'أسود', size: 'L', stock: 2 },
        { color: 'أحمر', size: 'M', stock: 3 },
        { color: 'أحمر', size: 'L', stock: 4 },
      ],
    });
  assert.equal(variantProduct.status, 201);
  assert.equal(variantProduct.body.data.stock, 10);
  const variantOrder = await request(app)
    .post('/api/orders')
    .send({
      customer: {
        name: 'أحمد خالد',
        phone: '0591234567',
        region: 'نابلس',
        notes: 'الرجاء الاتصال قبل الوصول',
      },
      items: [
        {
          productId: variantProduct.body.data._id,
          quantity: 1,
          selectedColor: 'أسود',
          selectedSize: 'M',
        },
      ],
    });
  assert.equal(variantOrder.status, 201);
  const soldOutVariant = await request(app)
    .post('/api/orders')
    .send({
      customer: {
        name: 'أحمد خالد',
        phone: '0591234567',
        region: 'نابلس',
        notes: 'الرجاء الاتصال قبل الوصول',
      },
      items: [
        {
          productId: variantProduct.body.data._id,
          quantity: 1,
          selectedColor: 'أسود',
          selectedSize: 'M',
        },
      ],
    });
  assert.equal(soldOutVariant.status, 409);

  const orders = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(orders.status, 200);
  assert.equal(orders.body.meta.total, 2);
});
