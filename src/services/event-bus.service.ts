import { db } from "@/lib/db";
import { AuditService } from "./audit.service";

export type DomainEventType =
  | "TASK_ASSIGNED"
  | "TASK_DUE"
  | "TASK_COMPLETED"
  | "LEAVE_REQUEST"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "MEETING_REMINDER"
  | "COMPLIANCE_DEADLINE"
  | "PAYROLL_PROCESSED"
  | "INVENTORY_LOW_STOCK"
  | "INVENTORY_OUT_OF_STOCK"
  | "OPERATION_ASSIGNED"
  | "OPERATION_COMPLETED"
  | "OPERATION_ISSUE_CRITICAL"
  | "LEGAL_CONTRACT_EXPIRING"
  | "LEGAL_RENEWAL_DUE"
  | "LEGAL_DEADLINE_APPROACHING"
  | "LEGAL_CASE_ASSIGNED"
  | "LEGAL_APPROVAL_REQUESTED"
  | "SYSTEM";

export interface DomainEvent<T = any> {
  type: DomainEventType;
  organizationId: string;
  actorId?: string; // Employee or User who triggered event
  targetUserIds: string[]; // List of user IDs to receive notifications
  title: string;
  message: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  actionUrl?: string;
  metadata?: T;
  auditAction?: string;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export class EventBusService {
  private static handlers: Map<DomainEventType, EventHandler[]> = new Map();

  /**
   * Register a custom listener for an event type
   */
  static subscribe(type: DomainEventType, handler: EventHandler) {
    const list = this.handlers.get(type) || [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  /**
   * Publishes an event across the company-wide activity system.
   * Automatically creates in-app Notification records for all targetUserIds.
   */
  static async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    try {
      // 1. Create In-App Notifications for all target recipients
      if (event.targetUserIds && event.targetUserIds.length > 0) {
        const notificationsData = event.targetUserIds.map((userId) => ({
          organizationId: event.organizationId,
          userId,
          type: event.type,
          title: event.title,
          message: event.message,
          priority: event.priority || "NORMAL",
          isRead: false,
          actionUrl: event.actionUrl,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        }));

        await db.notification.createMany({
          data: notificationsData,
        });
      }

      // 2. Audit log if specified
      if (event.auditAction && event.actorId) {
        await AuditService.logMutation({
          actorId: event.actorId,
          action: event.auditAction,
          entity: "EventBus",
          entityId: event.type,
          newValue: { title: event.title, targets: event.targetUserIds.length },
          metadata: { eventType: event.type, source: "event_bus" },
        });
      }

      // 3. Dispatch to registered custom handlers
      const listeners = this.handlers.get(event.type) || [];
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (err) {
          console.error(`[EventBus Handler Error - ${event.type}]:`, err);
        }
      }
    } catch (error) {
      console.error("[EventBus Publish Error]:", error);
    }
  }
}
