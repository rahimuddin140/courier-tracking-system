const pptxgen = require('pptxgenjs');
const path = require('path');

async function createPresentation() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  // Theme Colors
  const NAVY = '0F172A';
  const BLUE = '2563EB';
  const LIGHT_BLUE = 'DBEAFE';
  const DARK_SLATE = '1E293B';
  const TEXT_MUTED = '64748B';
  const BG_LIGHT = 'F8FAFC';
  const CARD_BG = 'FFFFFF';
  const GREEN = '059669';
  const LIGHT_GREEN = 'D1FAE5';
  const AMBER = 'D97706';
  const BORDER_COLOR = 'E2E8F0';

  // Helper for slide header
  function addHeader(slide, category, title, subtitle) {
    // Top background bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1.15,
      fill: { color: NAVY }
    });

    // Category tag
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.18,
      w: 10,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      bold: true,
      color: '93C5FD'
    });

    // Main title
    slide.addText(title, {
      x: 0.8,
      y: 0.42,
      w: 11,
      h: 0.45,
      fontSize: 20,
      fontFace: 'Arial',
      bold: true,
      color: 'FFFFFF'
    });

    // Subtitle / context
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8,
        y: 0.82,
        w: 11,
        h: 0.25,
        fontSize: 10,
        fontFace: 'Arial',
        color: 'CBD5E1'
      });
    }
  }

  // ==========================================
  // SLIDE 1: TITLE SLIDE (SIH Style)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    // Accent line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8,
      y: 1.2,
      w: 1.5,
      h: 0.08,
      fill: { color: BLUE }
    });

    // Problem Tag
    slide.addText('LOGISTICS & SUPPLY CHAIN INNOVATION • FULL-STACK WEB SOLUTION', {
      x: 0.8,
      y: 1.45,
      w: 11.5,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: '60A5FA'
    });

    // Main Title
    slide.addText('Courier & Parcel Delivery\nTracking System', {
      x: 0.8,
      y: 1.85,
      w: 11.5,
      h: 1.6,
      fontSize: 38,
      fontFace: 'Arial',
      bold: true,
      color: 'FFFFFF'
    });

    // Tagline
    slide.addText('An end-to-end transparent parcel lifecycle tracking platform with role-based orchestration, dynamic zone-based fee estimation, and tamper-proof audit trails.', {
      x: 0.8,
      y: 3.6,
      w: 10.5,
      h: 0.7,
      fontSize: 14,
      fontFace: 'Arial',
      color: '94A3B8'
    });

    // Card with Live Project Artifacts
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: 4.6,
      w: 11.7,
      h: 1.8,
      rectRadius: 0.15,
      fill: { color: DARK_SLATE },
      line: { color: '334155', width: 1.5 }
    });

    // Badges inside card
    slide.addText('LIVE ARTIFACTS & TECH STACK', {
      x: 1.1,
      y: 4.8,
      w: 8,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      bold: true,
      color: '38BDF8'
    });

    slide.addText('🌐 Production URL: https://courier-tracking-system-eta.vercel.app\n💻 GitHub Repository: https://github.com/rahimuddin140/courier-tracking-system\n⚡ Stack: Node.js • Express.js • EJS (SSR) • MongoDB Atlas • Bootstrap 5 • Vercel Serverless', {
      x: 1.1,
      y: 5.15,
      w: 11,
      h: 1.1,
      fontSize: 12,
      fontFace: 'Arial',
      color: 'F1F5F9',
      lineSpacing: 22
    });
  }

  // ==========================================
  // SLIDE 2: PROBLEM STATEMENT & INDUSTRY CHALLENGES
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Problem Background', 'Problem Statement: Challenges in Courier & Parcel Delivery', 'Key inefficiencies identified in current middle-mile and last-mile parcel logistics');

    const problems = [
      {
        title: 'Lack of Transparent Real-Time Tracking',
        desc: 'Traditional systems provide opaque, infrequent updates. Customers and senders lack granular visibility into exact transition stages and timestamps.',
        icon: '🔍',
        color: 'EF4444'
      },
      {
        title: 'Unbalanced Agent Workload Allocation',
        desc: 'Logistics hubs often suffer from manual dispatch bottlenecks. Dispatchers lack real-time visibility into field agent capacities and zone coverage.',
        icon: '⚖️',
        color: 'F59E0B'
      },
      {
        title: 'Opaque & Inconsistent Delivery Pricing',
        desc: 'Delivery fees are rarely calculated with transparent rules. Absence of real-time destination pincode zone pricing leads to billing ambiguities.',
        icon: '💵',
        color: '3B82F6'
      },
      {
        title: 'Absence of Immutable Audit Logs',
        desc: 'Disputed package states (e.g. premature mark as Delivered or unexplained Failed deliveries) cannot be verified without timestamped state logs.',
        icon: '📜',
        color: '8B5CF6'
      }
    ];

    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.95;
      const y = 1.45 + row * 2.5;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 5.75, h: 2.25,
        rectRadius: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1 }
      });

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.15, h: 2.25,
        fill: { color: p.color }
      });

      slide.addText(`${p.icon}  ${p.title}`, {
        x: x + 0.35, y: y + 0.25, w: 5.1, h: 0.45,
        fontSize: 14, fontFace: 'Arial', bold: true, color: NAVY
      });

      slide.addText(p.desc, {
        x: x + 0.35, y: y + 0.75, w: 5.1, h: 1.3,
        fontSize: 11, fontFace: 'Arial', color: TEXT_MUTED, lineSpacing: 18
      });
    });
  }

  // ==========================================
  // SLIDE 3: PROPOSED SOLUTION & CORE INNOVATIONS
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Our Approach', 'Proposed Solution: Comprehensive Logistics Management Platform', 'A centralized, role-based web architecture connecting Customers, Agents, and Administrators');

    const solutions = [
      {
        badge: 'ORCHESTRATION',
        title: 'Role-Based Ecosystem',
        points: [
          'Dedicated portals for Customer, Delivery Agent, and Admin',
          'Enforced role-based access control (RBAC) via middleware',
          'Admin fleet management & intelligent zone assignment',
          'Customer self-service parcel booking & cancellation'
        ]
      },
      {
        badge: 'INTEGRITY',
        title: 'Sequential State Machine',
        points: [
          'Strict lifecycle flow: Booked → Picked Up → In Transit → Out for Delivery → Delivered',
          'Prevention of skipped steps or unauthorized rollbacks',
          'Immutable status history log tracking user ID & timestamp',
          'Public tracking portal accessible via unique PKG Tracking ID'
        ]
      },
      {
        badge: 'TRANSPARENCY',
        title: 'Dynamic Rate Engine',
        points: [
          'Automated formula: Base Fee + (Weight × Rate per kg)',
          'Instant pincode-to-zone geographical mapping',
          'Live interactive price estimation on the booking screen',
          'Customizable zone parameters configurable by administrators'
        ]
      }
    ];

    solutions.forEach((s, idx) => {
      const x = 0.8 + idx * 3.97;
      const y = 1.5;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 3.75, h: 5.0,
        rectRadius: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1 }
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.3, y: y + 0.3, w: 1.8, h: 0.3,
        rectRadius: 0.08,
        fill: { color: LIGHT_BLUE }
      });

      slide.addText(s.badge, {
        x: x + 0.3, y: y + 0.32, w: 1.8, h: 0.25,
        fontSize: 9, fontFace: 'Arial', bold: true, color: BLUE, align: 'center'
      });

      slide.addText(s.title, {
        x: x + 0.3, y: y + 0.75, w: 3.15, h: 0.45,
        fontSize: 16, fontFace: 'Arial', bold: true, color: NAVY
      });

      const bullets = s.points.map(pt => ({ text: pt, options: { bullet: true, color: TEXT_MUTED, fontSize: 11, lineSpacing: 22 } }));
      slide.addText(bullets, {
        x: x + 0.3, y: y + 1.35, w: 3.15, h: 3.3
      });
    });
  }

  // ==========================================
  // SLIDE 4: SYSTEM ARCHITECTURE & DATA FLOW
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Technical Design', 'System Architecture & Multi-Tier Data Flow', 'Cloud-native serverless architecture designed for high availability and sub-second response times');

    const tiers = [
      {
        name: 'Client / Presentation Tier',
        sub: 'Browser & Mobile Web',
        tech: 'EJS Templates (Server-Side Rendering)\nBootstrap 5.3 Responsive Grid & Custom CSS\nDynamic DOM Rate Calculator & Stepper UI\nPublic Tracking Portal (No Login Required)',
        bg: 'EFF6FF',
        border: '3B82F6'
      },
      {
        name: 'Application & Routing Tier',
        sub: 'Node.js & Express.js Engine',
        tech: 'Modular Routers (Auth, Track, Customer, Agent, Admin)\nSession Authentication (express-session + bcrypt)\nRole Authorization Middlewares (RBAC)\nServerless Lambda Wrapper for Vercel Edge',
        bg: 'F0FDF4',
        border: '10B981'
      },
      {
        name: 'Data & Persistence Tier',
        sub: 'Cloud Database & Cache',
        tech: 'MongoDB Atlas Cloud Cluster (M0 / Replica Set)\nMongoose ODM with Schema Validation\nconnect-mongo Persistent Session Storage\nCached Connection Pooling for Serverless',
        bg: 'FAF5FF',
        border: '8B5CF6'
      }
    ];

    tiers.forEach((t, idx) => {
      const x = 0.8 + idx * 3.97;
      const y = 1.6;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 3.75, h: 4.8,
        rectRadius: 0.15,
        fill: { color: t.bg },
        line: { color: t.border, width: 1.5 }
      });

      slide.addText(t.name, {
        x: x + 0.25, y: y + 0.3, w: 3.25, h: 0.4,
        fontSize: 14, fontFace: 'Arial', bold: true, color: NAVY
      });

      slide.addText(t.sub, {
        x: x + 0.25, y: y + 0.7, w: 3.25, h: 0.3,
        fontSize: 10, fontFace: 'Arial', color: TEXT_MUTED
      });

      slide.addShape(pres.shapes.LINE, {
        x: x + 0.25, y: y + 1.1, w: 3.25, h: 0,
        line: { color: t.border, width: 1 }
      });

      slide.addText(t.tech, {
        x: x + 0.25, y: y + 1.3, w: 3.25, h: 3.2,
        fontSize: 11, fontFace: 'Arial', color: DARK_SLATE, lineSpacing: 22
      });
    });
  }

  // ==========================================
  // SLIDE 5: ROLE-BASED FEATURES & WORKFLOW
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'User Matrix', 'Role-Based Feature Matrix: Customer, Agent, Admin', 'Clear segregation of duties ensuring security, operational clarity, and accountability');

    const headers = [
      { text: 'Functional Capability', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF' } },
      { text: 'Customer', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center' } },
      { text: 'Delivery Agent', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center' } },
      { text: 'Logistics Admin', options: { bold: true, fill: { color: NAVY }, color: 'FFFFFF', align: 'center' } }
    ];

    const rows = [
      ['Account Self-Registration & Login', '✅ Yes', '❌ (Admin Created)', '❌ (Pre-Seeded)'],
      ['Book Parcel with Address & Weight', '✅ Yes', '❌ No', '✅ Yes'],
      ['Dynamic Delivery Charge Estimation', '✅ Yes (Live Preview)', '❌ No', '✅ Yes (Configure Rates)'],
      ['Unique Tracking ID Generation', '✅ Yes (PKG-...)', '❌ No', '✅ Yes'],
      ['Cancel Parcel (If Booked status)', '✅ Yes', '❌ No', '✅ Yes'],
      ['View Assigned Deliveries Queue', '❌ No', '✅ Yes (Filtered)', '✅ Yes (All Agents)'],
      ['Advance Lifecycle Status & Add Remarks', '❌ No', '✅ Yes (State Guarded)', '✅ Yes'],
      ['Fleet Workload Load-Balancing Table', '❌ No', '❌ No', '✅ Yes (Real-Time)'],
      ['Assign / Reassign Agent to Parcel', '❌ No', '❌ No', '✅ Yes (Any Parcel)'],
      ['Delivery Zone & Pincode CRUD', '❌ No', '❌ No', '✅ Yes (Base Fee + Rate)']
    ];

    const tableData = [
      headers,
      ...rows.map((r, i) => r.map((cell, ci) => ({
        text: cell,
        options: {
          fill: { color: i % 2 === 0 ? 'FFFFFF' : 'F1F5F9' },
          color: ci === 0 ? NAVY : (cell.includes('✅') ? GREEN : TEXT_MUTED),
          bold: ci === 0 || cell.includes('✅'),
          align: ci === 0 ? 'left' : 'center',
          fontSize: 10
        }
      })))
    ];

    slide.addTable(tableData, {
      x: 0.8,
      y: 1.45,
      w: 11.73,
      h: 5.0,
      colW: [4.23, 2.5, 2.5, 2.5],
      border: { color: BORDER_COLOR, width: 1 }
    });
  }

  // ==========================================
  // SLIDE 6: LIFECYCLE STATE MACHINE & AUDIT TRAIL
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Process Integrity', 'Sequential Lifecycle State Machine & Audit Trail', 'Strict state validation prevents unauthorized jumps and guarantees tamper-proof logs');

    const steps = [
      { name: '1. Booked', desc: 'Customer books online; tracking ID issued; assigned to queue', color: '64748B' },
      { name: '2. Picked Up', desc: 'Agent collects shipment from sender premises', color: '0284C7' },
      { name: '3. In Transit', desc: 'Dispatched to regional sorting and logistics hub', color: '2563EB' },
      { name: '4. Out for Delivery', desc: 'Field agent on route to recipient address', color: 'D97706' },
      { name: '5. Delivered / Failed', desc: 'Successful drop with signature OR logged failure with reason', color: '059669' }
    ];

    steps.forEach((st, idx) => {
      const x = 0.8 + idx * 2.4;
      const y = 1.7;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 2.15, h: 2.2,
        rectRadius: 0.12,
        fill: { color: CARD_BG },
        line: { color: st.color, width: 2 }
      });

      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.77, y: y + 0.25, w: 0.6, h: 0.6,
        fill: { color: st.color }
      });

      slide.addText(String(idx + 1), {
        x: x + 0.77, y: y + 0.25, w: 0.6, h: 0.6,
        fontSize: 14, fontFace: 'Arial', bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
      });

      slide.addText(st.name.replace(/^\d+\.\s*/, ''), {
        x: x + 0.1, y: y + 0.95, w: 1.95, h: 0.35,
        fontSize: 12, fontFace: 'Arial', bold: true, color: NAVY, align: 'center'
      });

      slide.addText(st.desc, {
        x: x + 0.15, y: y + 1.3, w: 1.85, h: 0.8,
        fontSize: 9, fontFace: 'Arial', color: TEXT_MUTED, align: 'center', lineSpacing: 13
      });

      // Arrow to next step
      if (idx < steps.length - 1) {
        slide.addText('➔', {
          x: x + 2.15, y: y + 0.85, w: 0.25, h: 0.3,
          fontSize: 14, fontFace: 'Arial', bold: true, color: '94A3B8', align: 'center'
        });
      }
    });

    // Audit Trail Card below
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.25, w: 11.73, h: 2.2,
      rectRadius: 0.15,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1 }
    });

    slide.addText('🛡️  Auditability Guarantee: The Immutable Status History Schema', {
      x: 1.1, y: 4.45, w: 11, h: 0.35,
      fontSize: 13, fontFace: 'Arial', bold: true, color: NAVY
    });

    slide.addText('Every state modification automatically appends a non-deletable document into the statusHistory array:\n• Exact Timestamp: Precise Date.now() recorded on the cloud server.\n• Actor Identity: Direct Mongoose ObjectId reference to the User/Agent who performed the update.\n• Detailed Remarks: Optional or mandatory delivery context (e.g. "Delivered to reception", "Customer phone unreachable").', {
      x: 1.1, y: 4.85, w: 11.1, h: 1.4,
      fontSize: 11, fontFace: 'Arial', color: TEXT_MUTED, lineSpacing: 20
    });
  }

  // ==========================================
  // SLIDE 7: DYNAMIC PRICING ENGINE (STRETCH GOAL)
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Algorithmic Feature', 'Dynamic Delivery Charge & Regional Zone Engine', 'Automated pricing calculation matching parcel weight with regional geographical pincodes');

    // Formula Callout Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.5, w: 11.73, h: 1.4,
      rectRadius: 0.15,
      fill: { color: NAVY }
    });

    slide.addText('MATHEMATICAL RATE FORMULA', {
      x: 1.1, y: 1.65, w: 10, h: 0.25,
      fontSize: 10, fontFace: 'Arial', bold: true, color: '60A5FA'
    });

    slide.addText('Delivery Charge = Zone.baseFee + ( Parcel.weight × Zone.perKgRate )', {
      x: 1.1, y: 1.95, w: 11, h: 0.5,
      fontSize: 18, fontFace: 'Arial', bold: true, color: 'FFFFFF'
    });

    slide.addText('Pincode matched dynamically via database index. If destination is unassigned, fallback to national baseline: ₹100 Base + ₹30/kg.', {
      x: 1.1, y: 2.45, w: 11, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: '94A3B8'
    });

    // Zone Examples Table
    const zoneHeaders = [
      { text: 'Operational Zone', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF' } },
      { text: 'Sample Covered Pincodes', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF' } },
      { text: 'Base Fee', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } },
      { text: 'Per-Kg Rate', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } },
      { text: 'Calculated Cost (3.0 kg package)', options: { bold: true, fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center' } }
    ];

    const zoneRows = [
      ['Metro North (Delhi-NCR)', '110001, 110002, 122001, 201301', '₹60', '₹25/kg', '₹60 + (3 × 25) = ₹135'],
      ['Western Commercial (Mumbai-Pune)', '400001, 400002, 411001, 411004', '₹70', '₹30/kg', '₹70 + (3 × 30) = ₹160'],
      ['Southern Tech (Bengaluru)', '560001, 560034, 560100, 560102', '₹65', '₹28/kg', '₹65 + (3 × 28) = ₹149'],
      ['National Default (Unassigned Hub)', 'All other national pincodes', '₹100', '₹30/kg', '₹100 + (3 × 30) = ₹190']
    ];

    const zoneTable = [
      zoneHeaders,
      ...zoneRows.map((r, i) => r.map((cell, ci) => ({
        text: cell,
        options: {
          fill: { color: i % 2 === 0 ? 'FFFFFF' : 'F1F5F9' },
          color: ci === 4 ? GREEN : NAVY,
          bold: ci === 0 || ci === 4,
          align: ci >= 2 ? 'center' : 'left',
          fontSize: 10
        }
      })))
    ];

    slide.addTable(zoneTable, {
      x: 0.8,
      y: 3.1,
      w: 11.73,
      h: 3.3,
      colW: [3.23, 3.2, 1.3, 1.4, 2.6],
      border: { color: BORDER_COLOR, width: 1 }
    });
  }

  // ==========================================
  // SLIDE 8: TECH STACK & PRODUCTION DEPLOYMENT
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Technology Blueprint', 'Tech Stack & Production Cloud Deployment', 'Engineered exclusively with industry-standard, lightweight, performant technologies');

    const stackCards = [
      {
        title: 'Backend Core',
        badge: 'RUNTIME & FRAMEWORK',
        color: '2563EB',
        items: [
          'Node.js v24 LTS: High concurrency event loop',
          'Express.js 4.19: Modular REST & SSR routing',
          'express-session: Stateful cookie management',
          'bcryptjs: Enterprise salted password hashing'
        ]
      },
      {
        title: 'Cloud Database',
        badge: 'DATABASE & ODM',
        color: '059669',
        items: [
          'MongoDB Atlas: M0 Cloud Replica Set cluster',
          'Mongoose 8: Strongly-typed ODM schemas',
          'connect-mongo: Multi-instance session store',
          'Connection Caching: Optimized for serverless'
        ]
      },
      {
        title: 'Frontend (SSR)',
        badge: 'USER INTERFACE',
        color: 'D97706',
        items: [
          'EJS (Embedded JavaScript): Fast SSR views',
          'express-ejs-layouts: DRY modular templating',
          'Bootstrap 5.3: Responsive mobile-ready UI',
          'Vanilla JavaScript: Zero-dependency client JS'
        ]
      },
      {
        title: 'DevOps & Hosting',
        badge: 'INFRASTRUCTURE',
        color: '8B5CF6',
        items: [
          'Vercel Serverless: Edge deployment & CDN',
          'GitHub Version Control: Clean commit history',
          'Automated Verification Suite: 17/17 tests',
          'dotenv: Complete environment secret isolation'
        ]
      }
    ];

    stackCards.forEach((c, idx) => {
      const x = 0.8 + idx * 2.97;
      const y = 1.5;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 2.8, h: 5.0,
        rectRadius: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1 }
      });

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.8, h: 0.1,
        fill: { color: c.color }
      });

      slide.addText(c.badge, {
        x: x + 0.2, y: y + 0.25, w: 2.4, h: 0.2,
        fontSize: 8, fontFace: 'Arial', bold: true, color: c.color
      });

      slide.addText(c.title, {
        x: x + 0.2, y: y + 0.55, w: 2.4, h: 0.35,
        fontSize: 14, fontFace: 'Arial', bold: true, color: NAVY
      });

      const bullets = c.items.map(it => ({ text: it, options: { bullet: true, color: TEXT_MUTED, fontSize: 10, lineSpacing: 20 } }));
      slide.addText(bullets, {
        x: x + 0.2, y: y + 1.1, w: 2.4, h: 3.6
      });
    });
  }

  // ==========================================
  // SLIDE 9: FEASIBILITY, SECURITY & SCALABILITY
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Operational Readiness', 'Feasibility, Security & Architectural Scalability', 'Built for immediate enterprise adoption, college evaluation, and large-scale deployments');

    const pillars = [
      {
        title: '🔐 Multi-Layer Security',
        color: '2563EB',
        bullets: [
          'Cryptographic Hashing: All user & agent passwords salted with bcryptjs (10 rounds).',
          'Strict Access Control: Layered middleware blocking unauthorized route elevation.',
          'Session Hardening: HttpOnly and SameSite=Lax flags preventing XSS & CSRF.',
          'Zero-Secret Exposure: .env and credentials excluded via .gitignore and Vercel secrets.'
        ]
      },
      {
        title: '📈 Cloud Scalability',
        color: '059669',
        bullets: [
          'Serverless Auto-Scale: Vercel serverless functions scale dynamically with zero server ops.',
          'Database Connection Pooling: Reuses active Mongoose connections across concurrent requests.',
          'Indexed Queries: High-speed lookups on trackingId, pincodes, and agent foreign keys.',
          'Stateless Web Tier: Persistent session store allows seamless multi-container load distribution.'
        ]
      },
      {
        title: '💼 Practical Feasibility',
        color: 'D97706',
        bullets: [
          'Zero Infrastructure Overhead: Runs on generous cloud free tiers (MongoDB Atlas + Vercel).',
          'Clean Separation of Concerns: Easy onboarding for new agents with zero training needed.',
          'Instant Portability: Single command seed script (npm run seed) deploys complete demo data.',
          'Tested Reliability: 17/17 automated unit and HTTP integration tests passing.'
        ]
      }
    ];

    pillars.forEach((p, idx) => {
      const y = 1.45 + idx * 1.7;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y, w: 11.73, h: 1.5,
        rectRadius: 0.12,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1 }
      });

      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.8, y, w: 0.15, h: 1.5,
        fill: { color: p.color }
      });

      slide.addText(p.title, {
        x: 1.15, y: y + 0.15, w: 11, h: 0.3,
        fontSize: 13, fontFace: 'Arial', bold: true, color: NAVY
      });

      const bullets = p.bullets.map(b => ({ text: b, options: { bullet: true, color: TEXT_MUTED, fontSize: 10, lineSpacing: 16 } }));
      slide.addText(bullets, {
        x: 1.15, y: y + 0.45, w: 11.2, h: 0.95
      });
    });
  }

  // ==========================================
  // SLIDE 10: FUTURE ROADMAP & EXTENSIBILITY
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: BG_LIGHT };
    addHeader(slide, 'Vision & Roadmap', 'Future Scope: Next-Generation Logistics Enhancements', 'Structured evolutionary phases transitioning from MVP to enterprise-grade AI logistics network');

    const roadmap = [
      {
        phase: 'PHASE 1 (COMPLETED)',
        title: 'Core Tracking & Management MVP',
        status: '✅ PRODUCTION READY',
        statusColor: GREEN,
        items: [
          'Full role-based authentication (Customer/Agent/Admin)',
          'Automated dynamic zone delivery fee calculation',
          '5-stage sequential lifecycle state machine',
          'Vercel live deployment & MongoDB Atlas cloud DB'
        ]
      },
      {
        phase: 'PHASE 2 (NEAR-TERM)',
        title: 'Real-Time Communication & Telemetry',
        status: '🔄 IN PIPELINE',
        statusColor: BLUE,
        items: [
          'Automated WhatsApp & SMS delivery alerts via Twilio',
          'Customer OTP verification at dropoff for high-value goods',
          'WebSockets for live agent dispatch & status pushes',
          'Integrated online payment gateway (Razorpay / Stripe)'
        ]
      },
      {
        phase: 'PHASE 3 (LONG-TERM)',
        title: 'AI & Smart Fleet Optimization',
        status: '🚀 STRATEGIC VISION',
        statusColor: AMBER,
        items: [
          'GPS Live Telemetry: Real-time map tracking with Leaflet/Google Maps',
          'AI Route Optimization: Travelling Salesperson optimization for agents',
          'Predictive Delivery Windows: ML ETA calculations based on traffic',
          'Dedicated Flutter Mobile App with barcode/QR code scanning'
        ]
      }
    ];

    roadmap.forEach((r, idx) => {
      const x = 0.8 + idx * 3.97;
      const y = 1.5;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 3.75, h: 5.0,
        rectRadius: 0.15,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1 }
      });

      slide.addText(r.phase, {
        x: x + 0.3, y: y + 0.3, w: 3.15, h: 0.25,
        fontSize: 9, fontFace: 'Arial', bold: true, color: r.statusColor
      });

      slide.addText(r.title, {
        x: x + 0.3, y: y + 0.6, w: 3.15, h: 0.5,
        fontSize: 14, fontFace: 'Arial', bold: true, color: NAVY
      });

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.3, y: y + 1.15, w: 2.2, h: 0.3,
        rectRadius: 0.08,
        fill: { color: r.statusColor === GREEN ? LIGHT_GREEN : LIGHT_BLUE }
      });

      slide.addText(r.status, {
        x: x + 0.3, y: y + 1.17, w: 2.2, h: 0.25,
        fontSize: 8, fontFace: 'Arial', bold: true, color: r.statusColor, align: 'center'
      });

      const bullets = r.items.map(it => ({ text: it, options: { bullet: true, color: TEXT_MUTED, fontSize: 10, lineSpacing: 22 } }));
      slide.addText(bullets, {
        x: x + 0.3, y: y + 1.65, w: 3.15, h: 3.1
      });
    });
  }

  // ==========================================
  // SLIDE 11: CONCLUSION & LIVE DEMO LINKS
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    slide.addText('PROJECT SUMMARY & LIVE DEMO ACCESS', {
      x: 0.8, y: 0.8, w: 11.5, h: 0.3,
      fontSize: 12, fontFace: 'Arial', bold: true, color: '60A5FA'
    });

    slide.addText('Courier & Parcel Delivery Tracking System', {
      x: 0.8, y: 1.15, w: 11.5, h: 0.6,
      fontSize: 28, fontFace: 'Arial', bold: true, color: 'FFFFFF'
    });

    slide.addText('A production-grade, highly dependable logistics solution successfully addressing tracking opacity, agent workload balancing, and transparent delivery pricing.', {
      x: 0.8, y: 1.8, w: 11.5, h: 0.5,
      fontSize: 13, fontFace: 'Arial', color: '94A3B8'
    });

    // Links Box
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 2.5, w: 5.7, h: 4.0,
      rectRadius: 0.15,
      fill: { color: DARK_SLATE },
      line: { color: '334155', width: 1.5 }
    });

    slide.addText('🌐 LIVE ARTIFACTS', {
      x: 1.1, y: 2.75, w: 5.0, h: 0.3,
      fontSize: 12, fontFace: 'Arial', bold: true, color: '38BDF8'
    });

    slide.addText('Live Production URL:\nhttps://courier-tracking-system-eta.vercel.app\n\nGitHub Repository:\nhttps://github.com/rahimuddin140/courier-tracking-system\n\nCloud Database:\nMongoDB Atlas Cloud Cluster (courierDB)\n\nAutomated Test Suite:\n17/17 Tests Passing (npm test)', {
      x: 1.1, y: 3.15, w: 5.1, h: 3.1,
      fontSize: 11, fontFace: 'Arial', color: 'F1F5F9', lineSpacing: 22
    });

    // Credentials Box
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.8, y: 2.5, w: 5.7, h: 4.0,
      rectRadius: 0.15,
      fill: { color: DARK_SLATE },
      line: { color: '334155', width: 1.5 }
    });

    slide.addText('🔑 EVALUATION DEMO ACCOUNTS', {
      x: 7.1, y: 2.75, w: 5.0, h: 0.3,
      fontSize: 12, fontFace: 'Arial', bold: true, color: '34D399'
    });

    slide.addText('Admin Portal:\nadmin@courier.com  |  Password: admin123\n\nDelivery Agent Portal:\nrajesh@courier.com  |  Password: agent123\n\nCustomer Portal:\ncustomer@courier.com  |  Password: customer123\n\nSample Tracking IDs for /track:\n• PKG-20260920-A101 (In Transit)\n• PKG-20260920-B202 (Delivered)\n• PKG-20260921-C303 (Out for Delivery)', {
      x: 7.1, y: 3.15, w: 5.1, h: 3.1,
      fontSize: 11, fontFace: 'Arial', color: 'F1F5F9', lineSpacing: 22
    });
  }

  // Save the presentation
  const outputFile = path.join(__dirname, '../Courier_Tracking_System_SIH_Presentation.pptx');
  await pres.writeFile({ fileName: outputFile });
  console.log(`✅ Presentation generated successfully at: ${outputFile}`);
}

createPresentation().catch(err => {
  console.error('Error creating presentation:', err);
  process.exit(1);
});
