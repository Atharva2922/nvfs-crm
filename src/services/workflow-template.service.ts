export interface WorkflowTemplateDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  module: "CRM" | "FINANCE" | "HR" | "PROJECTS" | "INVENTORY" | "VENDORS" | "CONTRACTS" | "COMPLIANCE" | "TASKS";
  triggerType:
    | "RECORD_CREATED"
    | "RECORD_UPDATED"
    | "STATUS_CHANGED"
    | "DUE_DATE_APPROACHING"
    | "DUE_DATE_PASSED"
    | "AMOUNT_EXCEEDS_THRESHOLD"
    | "INVENTORY_BELOW_THRESHOLD"
    | "APPROVAL_CREATED"
    | "APPROVAL_PENDING"
    | "PAYMENT_RECEIVED"
    | "TASK_OVERDUE";
  triggerConfig?: Record<string, any>;
  conditions: Array<{
    field: string;
    operator:
      | "equals"
      | "not_equals"
      | "greater_than"
      | "less_than"
      | "greater_than_or_equal"
      | "less_than_or_equal"
      | "contains"
      | "starts_with"
      | "status_is"
      | "date_before"
      | "date_after";
    value: any;
    logicalOperator?: "AND" | "OR";
  }>;
  actions: Array<{
    type:
      | "CREATE_TASK"
      | "SEND_NOTIFICATION"
      | "CREATE_ALERT"
      | "CREATE_APPROVAL_REQUEST"
      | "ASSIGN_USER"
      | "ASSIGN_DEPARTMENT"
      | "CHANGE_STATUS"
      | "ADD_ACTIVITY"
      | "ESCALATE";
    targetRole?: string;
    target?: string;
    payload: Record<string, any>;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  }>;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export class WorkflowTemplateService {
  static getTemplates(): WorkflowTemplateDefinition[] {
    return [
      {
        id: "tpl-overdue-invoice",
        name: "Overdue Invoice Reminder & CFO Alert",
        code: "TPL-FIN-001",
        description: "Automatically notifies finance team and CFO when client invoice due date passes with an unpaid balance",
        module: "FINANCE",
        triggerType: "DUE_DATE_PASSED",
        triggerConfig: { entity: "Invoice", daysOverdue: 1 },
        conditions: [
          { field: "balance", operator: "greater_than", value: 0 },
          { field: "status", operator: "not_equals", value: "PAID" },
        ],
        actions: [
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CFO",
            payload: {
              title: "Overdue Invoice Alert",
              message: "Invoice {{invoiceNumber}} for client {{clientName}} is overdue by {{daysOverdue}} days.",
              actionUrl: "/app/finance/invoices",
            },
            priority: "HIGH",
          },
          {
            type: "CREATE_TASK",
            targetRole: "FINANCE_DIRECTOR",
            payload: {
              title: "Collection Follow-up: Invoice {{invoiceNumber}}",
              description: "Follow up with {{clientName}} regarding outstanding balance of {{balance}}.",
              priority: "HIGH",
            },
          },
          {
            type: "CREATE_ALERT",
            payload: {
              severity: "CRITICAL",
              title: "Overdue Receivables Exposure",
              description: "Delinquent payment on invoice {{invoiceNumber}}.",
            },
          },
        ],
        priority: "HIGH",
      },
      {
        id: "tpl-new-lead-followup",
        name: "New Lead Rapid Response & Assignment",
        code: "TPL-CRM-001",
        description: "Assigns new inbound lead, schedules an immediate qualification task, and notifies the sales lead",
        module: "CRM",
        triggerType: "RECORD_CREATED",
        triggerConfig: { entity: "Lead" },
        conditions: [
          { field: "status", operator: "equals", value: "NEW" },
        ],
        actions: [
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CMO",
            payload: {
              title: "New Lead Created: {{companyName}}",
              message: "Lead {{firstName}} {{lastName}} from {{companyName}} registered in the system.",
              actionUrl: "/app/crm/leads",
            },
            priority: "NORMAL",
          },
          {
            type: "CREATE_TASK",
            payload: {
              title: "Qualify Inbound Lead: {{companyName}}",
              description: "Conduct initial discovery call within 24 hours.",
              priority: "HIGH",
            },
          },
          {
            type: "ADD_ACTIVITY",
            payload: {
              activityType: "WORKFLOW_AUTOMATION",
              notes: "Lead registered and rapid response follow-up task auto-generated.",
            },
          },
        ],
        priority: "MEDIUM",
      },
      {
        id: "tpl-inactive-client",
        name: "Inactive Client Retention Watchdog",
        code: "TPL-CRM-002",
        description: "Detects active enterprise clients with no touchpoints for over 60 days and creates an account review task",
        module: "CRM",
        triggerType: "DUE_DATE_PASSED",
        triggerConfig: { entity: "Client", daysInactive: 60 },
        conditions: [
          { field: "status", operator: "equals", value: "ACTIVE" },
        ],
        actions: [
          {
            type: "CREATE_TASK",
            payload: {
              title: "Client Retention Check-in: {{clientName}}",
              description: "Account has recorded zero touchpoints over the last 60 days. Schedule proactive relationship sync.",
              priority: "MEDIUM",
            },
          },
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CMO",
            payload: {
              title: "Client Health Warning: {{clientName}}",
              message: "No activity recorded for account {{clientName}} in 60+ days.",
              actionUrl: "/app/crm/clients",
            },
            priority: "NORMAL",
          },
        ],
        priority: "MEDIUM",
      },
      {
        id: "tpl-low-inventory",
        name: "Low Inventory Stock Reorder Alert",
        code: "TPL-INV-001",
        description: "Monitors warehouse inventory levels and creates a procurement replenishment task when stock reaches safety minimums",
        module: "INVENTORY",
        triggerType: "INVENTORY_BELOW_THRESHOLD",
        triggerConfig: { entity: "InventoryItem" },
        conditions: [
          { field: "availableQuantity", operator: "less_than_or_equal", value: "reorderLevel" },
        ],
        actions: [
          {
            type: "CREATE_ALERT",
            payload: {
              severity: "WARNING",
              title: "Low Inventory Threshold Reached",
              description: "SKU {{productName}} has dropped to {{availableQuantity}} units (minimum: {{reorderLevel}}).",
            },
          },
          {
            type: "CREATE_TASK",
            payload: {
              title: "Replenish Stock: {{productName}}",
              description: "Generate Purchase Request to reorder SKU {{sku}}.",
              priority: "HIGH",
            },
          },
        ],
        priority: "HIGH",
      },
      {
        id: "tpl-contract-expiry",
        name: "Contract Expiration 30-Day Renewal Horizon",
        code: "TPL-LEG-001",
        description: "Monitors active customer and vendor contracts, notifying legal and creating renewal tasks 30 days prior to expiration",
        module: "CONTRACTS",
        triggerType: "DUE_DATE_APPROACHING",
        triggerConfig: { entity: "LegalContract", daysBefore: 30 },
        conditions: [
          { field: "status", operator: "equals", value: "ACTIVE" },
        ],
        actions: [
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CEO",
            payload: {
              title: "Contract Expiring: {{contractTitle}}",
              message: "Contract {{contractNumber}} is set to expire on {{expiryDate}} (30 days remaining).",
              actionUrl: "/app/legal/contracts",
            },
            priority: "HIGH",
          },
          {
            type: "CREATE_TASK",
            payload: {
              title: "Review Contract Renewal: {{contractTitle}}",
              description: "Initiate renewal renegotiation with {{partyName}} before statutory deadline.",
              priority: "HIGH",
            },
          },
        ],
        priority: "HIGH",
      },
      {
        id: "tpl-project-delay",
        name: "Project Delay Detection & CTO Escalation",
        code: "TPL-OPS-001",
        description: "Detects when operation project target date passes without completion and escalates to CTO and project owner",
        module: "PROJECTS",
        triggerType: "DUE_DATE_PASSED",
        triggerConfig: { entity: "Operation" },
        conditions: [
          { field: "status", operator: "not_equals", value: "COMPLETED" },
        ],
        actions: [
          {
            type: "CREATE_ALERT",
            payload: {
              severity: "CRITICAL",
              title: "Critical Project Milestone Breach",
              description: "Operation {{operationCode}} ({{name}}) has missed its expected delivery date.",
            },
          },
          {
            type: "ESCALATE",
            targetRole: "CTO",
            payload: {
              hoursElapsed: 24,
              reason: "Project target milestone overdue",
            },
          },
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CTO",
            payload: {
              title: "Project Milestone Missed: {{name}}",
              message: "Delivery schedule exceeded for project {{operationCode}}.",
              actionUrl: "/app/operations",
            },
            priority: "URGENT",
          },
        ],
        priority: "CRITICAL",
      },
      {
        id: "tpl-approval-escalation",
        name: "Pending Approval 48-Hour Escalation",
        code: "TPL-GOV-001",
        description: "Monitors pending corporate approvals and escalates to department head or executive when unanswered for 48 hours",
        module: "TASKS",
        triggerType: "APPROVAL_PENDING",
        triggerConfig: { entity: "ApprovalRequest", hoursPending: 48 },
        conditions: [
          { field: "status", operator: "equals", value: "PENDING" },
        ],
        actions: [
          {
            type: "ESCALATE",
            payload: {
              hoursElapsed: 48,
              reason: "Approval request unanswered for 48 hours",
            },
          },
        ],
        priority: "HIGH",
      },
      {
        id: "tpl-upcoming-payment",
        name: "Upcoming Payment Obligation Reminder",
        code: "TPL-FIN-002",
        description: "Alerts treasury of upcoming accounts payable obligations 7 days before due date",
        module: "FINANCE",
        triggerType: "DUE_DATE_APPROACHING",
        triggerConfig: { entity: "PurchaseOrder", daysBefore: 7 },
        conditions: [
          { field: "status", operator: "equals", value: "ISSUED" },
        ],
        actions: [
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CFO",
            payload: {
              title: "Upcoming Vendor Payment Obligation",
              message: "PO #{{poNumber}} payment of {{total}} to {{vendorName}} due in 7 days.",
              actionUrl: "/app/finance/payables",
            },
            priority: "NORMAL",
          },
        ],
        priority: "MEDIUM",
      },
      {
        id: "tpl-compliance-deadline",
        name: "Regulatory Compliance Statutory Deadline",
        code: "TPL-LEG-002",
        description: "Generates high-priority alerts and tasks when a statutory regulatory compliance deadline is 14 days away",
        module: "COMPLIANCE",
        triggerType: "DUE_DATE_APPROACHING",
        triggerConfig: { entity: "LegalDeadline", daysBefore: 14 },
        conditions: [
          { field: "status", operator: "not_equals", value: "COMPLETED" },
        ],
        actions: [
          {
            type: "CREATE_ALERT",
            payload: {
              severity: "CRITICAL",
              title: "Statutory Compliance Deadline Approaching",
              description: "Regulatory compliance requirement {{title}} is due on {{dueDate}}.",
            },
          },
          {
            type: "CREATE_TASK",
            payload: {
              title: "Submit Compliance Evidence: {{title}}",
              description: "Gather and verify all audit documentation for deadline submission.",
              priority: "HIGH",
            },
          },
        ],
        priority: "CRITICAL",
      },
      {
        id: "tpl-high-value-transaction",
        name: "High-Value Transaction Executive Authorization",
        code: "TPL-FIN-003",
        description: "Automatically triggers a CFO / CEO approval request when an expense or purchase order exceeds ₹100,000",
        module: "FINANCE",
        triggerType: "AMOUNT_EXCEEDS_THRESHOLD",
        triggerConfig: { entity: "Expense", threshold: 100000 },
        conditions: [
          { field: "amount", operator: "greater_than_or_equal", value: 100000 },
        ],
        actions: [
          {
            type: "CREATE_APPROVAL_REQUEST",
            targetRole: "CFO",
            payload: {
              title: "CFO Approval Required: High-Value Spend ({{amount}})",
              description: "Expense #{{expenseNumber}} for {{description}} exceeds ₹100,000 corporate threshold.",
              entityType: "EXPENSE",
            },
          },
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CFO",
            payload: {
              title: "High-Value Transaction Flagged",
              message: "Spend requisition of {{amount}} requires executive sign-off.",
              actionUrl: "/app/dashboard/cfo",
            },
            priority: "HIGH",
          },
        ],
        priority: "CRITICAL",
      },
    ];
  }
}
