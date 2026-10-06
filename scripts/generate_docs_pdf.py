import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            # Header
            self.drawString(54, 11 * inch - 36, "NFVS CRM & HRMS — Comprehensive Project Documentation & Technical Dossier")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
            
            # Footer
            self.line(54, 46, 8.5 * inch - 54, 46)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#94a3b8"))
            self.drawString(54, 34, "CONFIDENTIAL  |  Naree Foundation & NF Venture Studio  |  Version 1.0.0")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 34, page_text)
            self.restoreState()

def build_pdf(filename="NFVS_CRM_Project_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0f172a")    # Slate 900
    SECONDARY = colors.HexColor("#1e40af")  # Blue 800
    ACCENT = colors.HexColor("#0284c7")     # Sky 600
    TEXT_DARK = colors.HexColor("#1e293b")  # Slate 800
    TEXT_MUTED = colors.HexColor("#64748b") # Slate 500
    BG_LIGHT = colors.HexColor("#f8fafc")   # Slate 50
    BORDER_COLOR = colors.HexColor("#cbd5e1")# Slate 300

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#334155")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # ================= COVER BANNER =================
    cover_table_data = [
        [
            Paragraph("<b>ENTERPRISE SYSTEM BRIEFING &amp; TECHNICAL DOSSIER</b>", ParagraphStyle('CoverPre', fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=ACCENT)),
        ],
        [
            Paragraph("Naree Foundation &amp; NF Venture Studio (NFVS)<br/>Unified CRM, HRMS &amp; Enterprise Operations Platform", title_style),
        ],
        [
            Paragraph("A complete end-to-end overview of platform architecture, technology rationale, multi-tenant isolation, granular access control, functional modules, data models, and deployment protocols.", subtitle_style)
        ]
    ]
    cover_table = Table(cover_table_data, colWidths=[7.0 * inch])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1.5, PRIMARY),
        ('PADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 14),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 10))

    # Metadata Card
    meta_data = [
        [
            Paragraph("<b>Target Organizations:</b> Naree Foundation &amp; NF Venture Studio", body_style),
            Paragraph("<b>System Version:</b> 1.0.0 (Production Release)", body_style)
        ],
        [
            Paragraph("<b>Document Classification:</b> Confidential / Managerial Briefing", body_style),
            Paragraph("<b>Audit Date:</b> October 2026", body_style)
        ],
        [
            Paragraph("<b>Primary Framework:</b> Next.js 16 (App Router) + React 19", body_style),
            Paragraph("<b>Database:</b> PostgreSQL (Supabase AWS) via Prisma ORM", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[3.5 * inch, 3.5 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ================= SECTION 1: EXECUTIVE SUMMARY =================
    story.append(Paragraph("1. Executive Summary &amp; Business Objectives", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    
    story.append(Paragraph("<b>1.1 Platform Purpose</b>", h2_style))
    story.append(Paragraph(
        "The <b>NFVS CRM &amp; HRMS Platform</b> is a centralized, cloud-native Enterprise Resource Planning (ERP) "
        "and Human Resource Management System engineered specifically to eliminate fragmented third-party SaaS subscriptions. "
        "It establishes a unified, secure portal powering day-to-day operations for both <b>Naree Foundation</b> "
        "(a non-profit social development organization) and <b>NF Venture Studio</b> (a commercial venture incubator).",
        body_style
    ))

    story.append(Paragraph("<b>1.2 Strategic Business Value &amp; ROI</b>", h2_style))
    story.append(Paragraph("&bull; <b>Zero Cross-Tenant Leakage:</b> Hosts two distinct corporate entities on a single unified cloud deployment while enforcing airtight organizational boundaries.", bullet_style))
    story.append(Paragraph("&bull; <b>Absolute Peer Privacy &amp; Data Isolation:</b> Standard employees cannot inspect peer tasks, managerial workflows, compensation structures, or internal operational agendas.", bullet_style))
    story.append(Paragraph("&bull; <b>Strict Direct Line Manager Governance:</b> Implements a real-world managerial tree where Line Managers only delegate to and monitor their directly assigned subordinates.", bullet_style))
    story.append(Paragraph("&bull; <b>Immutable Mutation Audit Trail:</b> Every record mutation (create, edit, delete, status change) is permanently logged with actor credentials, timestamps, and field diffs for governance compliance.", bullet_style))

    story.append(Spacer(1, 10))

    # ================= SECTION 2: TECHNOLOGY STACK =================
    story.append(Paragraph("2. Complete Technology Stack &amp; Architectural Rationale", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    
    tech_data = [
        [
            Paragraph("<b>Layer / Role</b>", table_header_style),
            Paragraph("<b>Technology</b>", table_header_style),
            Paragraph("<b>Version</b>", table_header_style),
            Paragraph("<b>Technical Purpose &amp; Strategic Rationale</b>", table_header_style)
        ],
        [
            Paragraph("<b>Full-Stack Framework</b>", table_cell_bold),
            Paragraph("Next.js (App Router)", table_cell_style),
            Paragraph("16.3.4", table_cell_style),
            Paragraph("Delivers React Server Components (RSC) for zero-client bundle data fetching, fast Server-Side Rendering (SSR), and unified API route handlers.", table_cell_style)
        ],
        [
            Paragraph("<b>Frontend Engine</b>", table_cell_bold),
            Paragraph("React", table_cell_style),
            Paragraph("19.2.8", table_cell_style),
            Paragraph("Modern concurrent rendering, fine-grained DOM hydration, and modular UI component lifecycles for high-performance dashboard widgets.", table_cell_style)
        ],
        [
            Paragraph("<b>Language Foundation</b>", table_cell_bold),
            Paragraph("TypeScript", table_cell_style),
            Paragraph("5.x", table_cell_style),
            Paragraph("End-to-end static type safety bridging database models, API payload contracts, and UI components to eliminate runtime type errors.", table_cell_style)
        ],
        [
            Paragraph("<b>Design System</b>", table_cell_bold),
            Paragraph("Tailwind CSS", table_cell_style),
            Paragraph("4.x", table_cell_style),
            Paragraph("Utility-first styling powering a bespoke dark-mode enterprise theme (Deep Slate #0a0f1d, Navy #0f172a, Emerald, Amber, Blue).", table_cell_style)
        ],
        [
            Paragraph("<b>ORM &amp; Modeling</b>", table_cell_bold),
            Paragraph("Prisma ORM", table_cell_style),
            Paragraph("6.19.3", table_cell_style),
            Paragraph("Type-safe database abstraction managing 3,400+ lines of declarative schema models with automated migration synchronization.", table_cell_style)
        ],
        [
            Paragraph("<b>Persistence Layer</b>", table_cell_bold),
            Paragraph("PostgreSQL (AWS)", table_cell_style),
            Paragraph("15+", table_cell_style),
            Paragraph("ACID-compliant relational engine hosted on Supabase AWS. Utilizes PgBouncer on port 6543 for API traffic and port 5432 for schema migrations.", table_cell_style)
        ],
        [
            Paragraph("<b>Input Validation</b>", table_cell_bold),
            Paragraph("Zod", table_cell_style),
            Paragraph("4.5.4", table_cell_style),
            Paragraph("Strict runtime schema parsing and sanitization protecting all API boundaries from malformed or unauthorized field injections.", table_cell_style)
        ],
        [
            Paragraph("<b>Security &amp; Hashing</b>", table_cell_bold),
            Paragraph("bcryptjs", table_cell_style),
            Paragraph("3.0.3", table_cell_style),
            Paragraph("Multi-round salted cryptographic password hashing safeguarding system credentials and employee account authentications.", table_cell_style)
        ],
        [
            Paragraph("<b>Iconography</b>", table_cell_bold),
            Paragraph("Lucide React", table_cell_style),
            Paragraph("1.43.0", table_cell_style),
            Paragraph("Crisp, tree-shakable SVG iconography optimized for navigation, system badges, and operational status chips.", table_cell_style)
        ]
    ]

    tech_table = Table(tech_data, colWidths=[1.3 * inch, 1.4 * inch, 0.7 * inch, 3.6 * inch])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 14))

    # ================= SECTION 3: SYSTEM ARCHITECTURE =================
    story.append(Paragraph("3. System Architecture &amp; Design Patterns", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("<b>3.1 Layered Modular Monolith Architecture</b>", h2_style))
    story.append(Paragraph(
        "The system employs a <b>Layered Modular Monolith</b> design pattern. This pattern delivers the rapid development "
        "and transactional simplicity of a single cohesive codebase while preserving clean domain separation between modules "
        "(HR, Tasks, Attendance, Payroll, and CRM):",
        body_style
    ))

    arch_box = [
        [Paragraph("<b>1. PRESENTATION LAYER:</b> Next.js Server Components (RSC) + Interactive Client Components + Tailwind CSS", table_cell_bold)],
        [Paragraph("&darr; <i>Authenticated JSON Requests / HTTP-Only Cookies</i>", callout_style)],
        [Paragraph("<b>2. CONTROLLER &amp; ROUTING LAYER:</b> Next.js App Router API Handlers (/api/*) + Zod Schema Validation", table_cell_bold)],
        [Paragraph("&darr; <i>Validated Business Invocations</i>", callout_style)],
        [Paragraph("<b>3. BUSINESS SERVICE LAYER:</b> TaskService | EmployeeService | RbacService | AuditLogger | PayrollEngine", table_cell_bold)],
        [Paragraph("&darr; <i>Type-Safe Relational Queries</i>", callout_style)],
        [Paragraph("<b>4. DATA ACCESS / ORM LAYER:</b> Prisma ORM Client + PgBouncer Transaction Pooler (Port 6543)", table_cell_bold)],
        [Paragraph("&darr; <i>ACID Relational SQL</i>", callout_style)],
        [Paragraph("<b>5. PERSISTENCE STORAGE LAYER:</b> PostgreSQL Database Instance (Supabase Cloud Infrastructure)", table_cell_bold)]
    ]
    arch_table = Table(arch_box, colWidths=[7.0 * inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>3.2 Architectural Highlights &amp; Reliability Features</b>", h2_style))
    story.append(Paragraph("&bull; <b>Stateless Route Handlers:</b> Endpoints authenticate per request using secure JWT/cookies and dynamic headers, enabling horizontal scaling without sticky sessions.", bullet_style))
    story.append(Paragraph("&bull; <b>Connection Pooling:</b> Utilizes PgBouncer transaction-mode connection pooling to handle high concurrency without overwhelming PostgreSQL process limits.", bullet_style))
    story.append(Paragraph("&bull; <b>Deterministic Hydration Protection:</b> Date and time values utilize explicit server-matched locale formatting (`en-US` / `en-IN`) and hydration guards to eliminate SSR client-render mismatches.", bullet_style))

    story.append(PageBreak())

    # ================= SECTION 4: MULTI-TENANCY =================
    story.append(Paragraph("4. Multi-Tenancy &amp; Corporate Boundary Isolation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph(
        "A central requirement of the system is the simultaneous operation of <b>Naree Foundation</b> and <b>NF Venture Studio</b> "
        "within a unified platform without compromising data confidentiality or legal entity independence.",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Shared Database, Row-Level Logical Isolation:</b> All operational records (Employees, Tasks, Leaves, Clients, Attendance) include a mandatory foreign key <code>organizationId</code> referencing the Organization master table.", bullet_style))
    story.append(Paragraph("&bull; <b>Context Resolution Middleware:</b> API requests automatically inspect the active tenant via the <code>x-company-id</code> header or user session. Queries strictly filter by <code>where: { organizationId }</code> to prevent cross-tenant record leakage.", bullet_style))
    story.append(Paragraph("&bull; <b>Real-Time Tenant Switcher:</b> Authorized executive roles (Super Admin, Board, CEO) can seamlessly toggle their operational workspace between Naree Foundation and NF Venture Studio via the global header switcher.", bullet_style))

    story.append(Spacer(1, 10))

    # ================= SECTION 5: RBAC HIERARCHY =================
    story.append(Paragraph("5. Role-Based Access Control (RBAC) &amp; Security Governance", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph(
        "The platform enforces a granular, numeric hierarchy with 9 distinct operational privilege tiers:",
        body_style
    ))

    rbac_data = [
        [
            Paragraph("<b>Level</b>", table_header_style),
            Paragraph("<b>Role Code</b>", table_header_style),
            Paragraph("<b>Role Title</b>", table_header_style),
            Paragraph("<b>Operational Permissions &amp; Data Visibility Scope</b>", table_header_style)
        ],
        [
            Paragraph("<b>100</b>", table_cell_bold),
            Paragraph("SUPER_ADMIN", table_cell_style),
            Paragraph("Global Super Administrator", table_cell_style),
            Paragraph("Complete global platform oversight, role configuration, tenant creation, and system audit logs. Operates with non-interfering read-only operational visibility.", table_cell_style)
        ],
        [
            Paragraph("<b>90</b>", table_cell_bold),
            Paragraph("ADMIN", table_cell_style),
            Paragraph("Platform Administrator", table_cell_style),
            Paragraph("Full organization-wide management, CXO account oversight, and global system configurations.", table_cell_style)
        ],
        [
            Paragraph("<b>80</b>", table_cell_bold),
            Paragraph("CHAIRPERSON", table_cell_style),
            Paragraph("Board Chairperson", table_cell_style),
            Paragraph("Strategic executive visibility, board-level performance analytics, cross-entity compliance audits.", table_cell_style)
        ],
        [
            Paragraph("<b>75</b>", table_cell_bold),
            Paragraph("CEO", table_cell_style),
            Paragraph("Chief Executive Officer", table_cell_style),
            Paragraph("Full organizational operational authority. Dispatches directives to CXOs, approves high-level milestones.", table_cell_style)
        ],
        [
            Paragraph("<b>70</b>", table_cell_bold),
            Paragraph("C-SUITE / HR", table_cell_style),
            Paragraph("COO, CFO, CIO, CTO, CMO, HR", table_cell_style),
            Paragraph("Departmental leadership. HR manages full employee lifecycles, dossiers, compensation, and onboarding dispatches.", table_cell_style)
        ],
        [
            Paragraph("<b>50</b>", table_cell_bold),
            Paragraph("DEPARTMENT_HEAD", table_cell_style),
            Paragraph("Department Head", table_cell_style),
            Paragraph("Supervises departmental workflows, approves leaves, and oversees cross-team deliverable timelines.", table_cell_style)
        ],
        [
            Paragraph("<b>30</b>", table_cell_bold),
            Paragraph("MANAGER", table_cell_style),
            Paragraph("Direct Line Manager", table_cell_style),
            Paragraph("Direct subordinate task tracking, work delegation, and status oversight for assigned direct reports only.", table_cell_style)
        ],
        [
            Paragraph("<b>10</b>", table_cell_bold),
            Paragraph("EMPLOYEE", table_cell_style),
            Paragraph("Staff Member", table_cell_style),
            Paragraph("Strict self-access: Personal assigned tasks, personal profile, own attendance records, and personal payslips. Absolutely no peer visibility.", table_cell_style)
        ]
    ]

    rbac_table = Table(rbac_data, colWidths=[0.6 * inch, 1.4 * inch, 1.6 * inch, 3.4 * inch])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(rbac_table)
    story.append(Spacer(1, 12))

    # ================= SECTION 6: TASK DELEGATION & MANAGER SYSTEM =================
    story.append(Paragraph("6. Hierarchical Task Delegation &amp; Direct Line Manager System", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("<b>6.1 The Operational Problem Solved</b>", h2_style))
    story.append(Paragraph(
        "In standard corporate CRM/task boards, all team members frequently see each other's tasks, leading to privacy breaches, "
        "inter-departmental gossip, and exposure of sensitive operational assignments. The NFVS CRM implements a strict "
        "<b>Attribute-Based + Managerial Hierarchy Access Control (ABAC)</b> rule set.",
        body_style
    ))

    story.append(Paragraph("<b>6.2 Enforced Security &amp; Delegation Rules</b>", h2_style))
    story.append(Paragraph("1. <b>Standard Staff Peer Isolation:</b> Regular employees (Level &lt; 30) can ONLY query and inspect tasks where they are the explicit Assignee (<code>assigneeId === employeeId</code>) or Creator. They have zero visibility into peer tasks or manager workflows.", bullet_style))
    story.append(Paragraph("2. <b>Direct Line Manager Scoping:</b> A Line Manager (Level 30) can view: (a) Their own tasks, (b) Tasks they authored, and (c) Tasks assigned to subordinates who explicitly report to them (<code>assignee.managerId === managerId</code>). Line Managers cannot view tasks of employees reporting to other managers.", bullet_style))
    story.append(Paragraph("3. <b>Restricted Delegation Controls:</b> When a Line Manager creates or reassigns a task, the assignee dropdown dynamically filters to display <i>only their direct line reports</i>, preventing unauthorized workload dumping onto other teams.", bullet_style))
    story.append(Paragraph("4. <b>Executive Global Visibility:</b> High-level leadership (CEO, HR, Admin, Super Admin) maintains global cross-team audit visibility for comprehensive oversight.", bullet_style))

    story.append(Spacer(1, 10))

    # ================= SECTION 7: CORE FUNCTIONAL MODULES =================
    story.append(Paragraph("7. Core Functional Modules &amp; Feature Breakdown", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    modules_data = [
        [
            Paragraph("<b>Module</b>", table_header_style),
            Paragraph("<b>Core Capabilities &amp; Technical Specifications</b>", table_header_style)
        ],
        [
            Paragraph("<b>7.1 Employee Lifecycle &amp; 10-Section Dossier</b>", table_cell_bold),
            Paragraph(
                "Comprehensive 10-tab employee master: (1) Personal Demographics, (2) Official Employment (ID, Designation, Department, Line Manager, Work Mode), "
                "(3) Permanent &amp; Current Address, (4) Government IDs (Aadhaar, PAN, Passport), (5) Bank &amp; Direct Deposit Details, "
                "(6) Emergency Contacts, (7) Education History, (8) Experience &amp; Skills, (9) Document Soft Copies, and (10) Corporate Credentials &amp; Role.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.2 Document Management Vault (10MB)</b>", table_cell_bold),
            Paragraph(
                "Encrypted soft-copy document repository supporting PDF, PNG, JPG, and DOCX files up to 10MB per document. "
                "Maintains verification lifecycle states: <code>PENDING_VERIFICATION</code>, <code>VERIFIED</code>, and <code>REJECTED</code> with audit notes.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.3 Task Management Engine</b>", table_cell_bold),
            Paragraph(
                "Multi-view operational board featuring Kanban lanes (TODO, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED), priority tagging (LOW, MEDIUM, HIGH, URGENT), "
                "client/project linking, and real-time nested discussion threads.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.4 Attendance &amp; Shift Tracking</b>", table_cell_bold),
            Paragraph(
                "Daily check-in / check-out timestamps with client IP address logging, break tracking, total work duration computation, and automated late/half-day flagging.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.5 Leave &amp; Absence Governance</b>", table_cell_bold),
            Paragraph(
                "Multi-category leave balances (Casual, Sick, Paid, Maternity). Multi-step approval routing through direct line manager and HR, integrated with organizational holiday calendars.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.6 Payroll &amp; Compensation Automation</b>", table_cell_bold),
            Paragraph(
                "Granular salary structures (Basic Pay, HRA, Special Allowance, PF, PT, Professional Tax). Monthly payroll period generation, tax deductions, and automated printable payslip generation.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.7 Client CRM &amp; Pipeline</b>", table_cell_bold),
            Paragraph(
                "Corporate client registry, opportunity deal pipeline tracking (LEAD, PROSPECT, PROPOSAL, NEGOTIATION, WON, LOST), interaction logs, and meeting schedule widgets.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.8 Operations &amp; Duty Dispatch</b>", table_cell_bold),
            Paragraph(
                "Field operations dispatching (OnDutyAssignment) with real-time status (SCHEDULED, ACTIVE, COMPLETED, INCIDENT_FLAGGED) and automated employee availability monitoring.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>7.9 Mutation Audit Logging</b>", table_cell_bold),
            Paragraph(
                "Tamper-evident audit engine capturing actor identity, target entity, action type (CREATE, UPDATE, DELETE), IP address, timestamp, and field-level change diffs.",
                table_cell_style
            )
        ]
    ]

    modules_table = Table(modules_data, colWidths=[2.2 * inch, 4.8 * inch])
    modules_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(modules_table)

    story.append(PageBreak())

    # ================= SECTION 8: DATABASE SCHEMA & DATA MODEL =================
    story.append(Paragraph("8. Database Schema &amp; Data Model Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph(
        "The relational schema is maintained through Prisma ORM across 3,499 declarative lines. Below is the core relational topology:",
        body_style
    ))

    schema_pre = (
        "[Organization: Tenant Master (Naree / NFVS)]\n"
        "   |-- 1:N --> [Department] (HR, Operations, Finance, Tech, Incubation)\n"
        "   |-- 1:N --> [Employee] <--------+ (Self-referential managerId hierarchy)\n"
        "   |              |-- 1:1 --> [User] (Authentication credentials & Role level)\n"
        "   |              |-- 1:1 --> [EmployeeProfile] (10-Section Personal Dossier)\n"
        "   |              |-- 1:N --> [EmployeeDocument] (Soft copies up to 10MB)\n"
        "   |              |-- 1:N --> [AttendanceRecord] (Clock events, work hours)\n"
        "   |              |-- 1:N --> [LeaveRequest] (Approval workflow)\n"
        "   |              |-- 1:N --> [SalaryStructure] & [PayrollRecord]\n"
        "   |              +-- 1:N --> [Task] (Assignee / Creator)\n"
        "   |-- 1:N --> [Client] -- 1:N --> [Opportunity] (CRM Deals & Pipelines)\n"
        "   |-- 1:N --> [Operation] (Field missions & on-duty dispatches)\n"
        "   +-- 1:N --> [AuditLog] (Immutable compliance mutation history)"
    )
    story.append(Preformatted(schema_pre, code_style))
    story.append(Spacer(1, 10))

    # ================= SECTION 9: API CATALOG =================
    story.append(Paragraph("9. API Architecture &amp; Endpoint Catalog", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    api_data = [
        [
            Paragraph("<b>HTTP Route</b>", table_header_style),
            Paragraph("<b>Methods</b>", table_header_style),
            Paragraph("<b>Auth &amp; Scoping</b>", table_header_style),
            Paragraph("<b>Functionality &amp; Business Rules</b>", table_header_style)
        ],
        [
            Paragraph("/api/auth/login", table_cell_bold),
            Paragraph("POST", table_cell_style),
            Paragraph("Public", table_cell_style),
            Paragraph("Validates corporate credentials against bcrypt hash; issues secure HTTP-only session cookies.", table_cell_style)
        ],
        [
            Paragraph("/api/auth/me", table_cell_bold),
            Paragraph("GET", table_cell_style),
            Paragraph("Authenticated", table_cell_style),
            Paragraph("Returns active user identity, numeric role level, employee link, and active company context.", table_cell_style)
        ],
        [
            Paragraph("/api/employees", table_cell_bold),
            Paragraph("GET, POST", table_cell_style),
            Paragraph("HR / Admin / CXO", table_cell_style),
            Paragraph("Lists paginated employees with department filters; registers new employees with direct line manager assignment.", table_cell_style)
        ],
        [
            Paragraph("/api/employees/[id]", table_cell_bold),
            Paragraph("GET, PATCH, DELETE", table_cell_style),
            Paragraph("RBAC Scoped", table_cell_style),
            Paragraph("Retrieves full dossier; updates master fields; performs administrative deactivation/deletion.", table_cell_style)
        ],
        [
            Paragraph("/api/employees/[id]/profile", table_cell_bold),
            Paragraph("GET, PUT", table_cell_style),
            Paragraph("Self / HR", table_cell_style),
            Paragraph("Retrieves and saves 10-section profile information; recalculates profile completion score.", table_cell_style)
        ],
        [
            Paragraph("/api/employees/[id]/documents", table_cell_bold),
            Paragraph("GET, POST", table_cell_style),
            Paragraph("Self / HR", table_cell_style),
            Paragraph("Uploads soft-copy identity and qualification documents up to 10MB; updates document verification state.", table_cell_style)
        ],
        [
            Paragraph("/api/tasks", table_cell_bold),
            Paragraph("GET, POST", table_cell_style),
            Paragraph("Authenticated (Scoped)", table_cell_style),
            Paragraph("Fetches tasks strictly isolated by Line Manager and Employee hierarchy; dispatches new tasks.", table_cell_style)
        ],
        [
            Paragraph("/api/tasks/[id]", table_cell_bold),
            Paragraph("GET, PATCH, DELETE", table_cell_style),
            Paragraph("Task Authorized", table_cell_style),
            Paragraph("Updates task status (TODO &rarr; COMPLETED), modifies priority, updates deadlines.", table_cell_style)
        ],
        [
            Paragraph("/api/attendance", table_cell_bold),
            Paragraph("GET, POST", table_cell_style),
            Paragraph("Authenticated", table_cell_style),
            Paragraph("Logs real-time employee check-in / check-out timestamps, IP addresses, and retrieves monthly attendance logs.", table_cell_style)
        ],
        [
            Paragraph("/api/payroll/generate", table_cell_bold),
            Paragraph("POST", table_cell_style),
            Paragraph("HR / CFO / Admin", table_cell_style),
            Paragraph("Executes automated batch payroll generation and populates individual employee monthly payslips.", table_cell_style)
        ]
    ]

    api_table = Table(api_data, colWidths=[1.8 * inch, 0.9 * inch, 1.3 * inch, 3.0 * inch])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    story.append(api_table)
    story.append(Spacer(1, 10))

    # ================= SECTION 10: DEPLOYMENT GUIDE =================
    story.append(Paragraph("10. Deployment, Infrastructure &amp; Operational Runbook", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("<b>10.1 Environment Variables Architecture</b>", h2_style))
    story.append(Paragraph("&bull; <code>DATABASE_URL</code>: High-throughput transaction-mode connection pooler via PgBouncer on port <b>6543</b> for all runtime API traffic.", bullet_style))
    story.append(Paragraph("&bull; <code>DIRECT_URL</code>: Direct session connection to PostgreSQL on port <b>5432</b> for executing DDL schema migrations with Prisma CLI.", bullet_style))

    story.append(Paragraph("<b>10.2 Production Release Sequence</b>", h2_style))
    deploy_cmd = (
        "# 1. Install locked dependencies\n"
        "npm install\n\n"
        "# 2. Re-generate Prisma Client TypeScript bindings\n"
        "npx prisma generate\n\n"
        "# 3. Execute database schema migrations\n"
        "npx prisma migrate deploy\n\n"
        "# 4. Build optimized Next.js production bundle\n"
        "npm run build\n\n"
        "# 5. Start production runtime server\n"
        "npm run start"
    )
    story.append(Preformatted(deploy_cmd, code_style))
    story.append(Spacer(1, 14))

    # Signature / Sign-off block
    sign_data = [
        [
            Paragraph("<b>Prepared By:</b> Engineering &amp; Operations Team", body_style),
            Paragraph("<b>Approved By:</b> Executive Leadership (Naree &amp; NFVS)", body_style)
        ],
        [
            Paragraph("<b>Target Audience:</b> Internal Management &amp; Technical Leads", body_style),
            Paragraph("<b>Release State:</b> Verified Production Ready", body_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[3.5 * inch, 3.5 * inch])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(sign_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF Generated successfully at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    out_file = r"d:\nfvs_crm\NFVS_CRM_Project_Documentation.pdf"
    build_pdf(out_file)
