import { AuditLog } from '../models/AuditLog.js';

export function audit(req, action, entityType, entityId = '', details = {}) {
  return AuditLog.create({
    actor: req.user?.email || 'system',
    action,
    entityType,
    entityId: String(entityId),
    details,
    ip: req.ip || '',
  }).catch(() => undefined);
}
