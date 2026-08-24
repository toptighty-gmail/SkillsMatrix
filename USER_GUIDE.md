# Skills Matrix Application — User Guide & Feature Documentation

Welcome to the **Skills Matrix Application**, a modern, interactive web application engineered to track, manage, analyze, and visualize technical skills, team competencies, and capability gaps across your organization.

---

## 📋 Executive Overview

The **Skills Matrix Application** provides engineering managers, team leads, and HR leaders with complete visibility into the technical capabilities of their organization. By mapping team members against a catalog of tracked skills and competency levels (from 0 to 5 stars), the application enables data-driven decision-making for:

- **Resource Allocation & Project Staffing**: Quickly locate team members with specific technical mastery (e.g., Expert in React or Strong in PostgreSQL).
- **Skill Gap Identification**: Contrast team skill requirements against actual team capabilities to identify training needs or hiring priorities.
- **Team Capability Benchmarking**: Measure category-level and team-level proficiency metrics in real time.
- **Data Management & Governance**: Seamlessly import/export team rosters and connect to PostgreSQL via Supabase with full Row-Level Security (RLS).
- **Historical Progress Tracking**: Preserve immutable rating change histories using temporal boolean flags (`is_current = true / false`) to enable long-term team growth reports.

---

## 🏗️ Architecture & Design System

### Technical Stack
- **Frontend Core**: React 19, Vite, JavaScript (ES Modules).
- **Icons & Visuals**: Lucide React icon suite.
- **Styling & Theme**: Modern Vanilla CSS featuring a dark-mode **Glassmorphism Design System** with custom properties, smooth transitions, star rating widgets, and responsive layout containers.
- **Backend & Database**: Supabase PostgreSQL connection with fallback to an **Autonomous Demo Mode** featuring pre-populated mock datasets.
- **Code Quality**: Oxlint integration for fast linting.

---

## 🗄️ Database Architecture & Star Schema Specification

The database architecture is designed using a **Dimensional Data Modeling / Star Schema** pattern optimized for both fast online transactional queries (OLTP) and analytical progress reporting (OLAP).

### 📐 Entity-Relationship Star Schema Diagram

```ascii
+-----------------------+         +-------------------------------+         +-----------------------+
|        PERSON         |         |   PERSON_SKILL_ASSESSMENTS    |         |        SKILLS         |
+-----------------------+         +-------------------------------+         +-----------------------+
| id (PK, UUID)         |<------->| id (PK, UUID)                 |<------->| id (PK, UUID)         |
| full_name             |         | person_id (FK -> person)      |         | name                  |
| role_title            |         | skill_id (FK -> skills)       |         | category_id (FK)----->|-----+
| email                 |         | competency_level_id (1..5)    |         | vendor                |     |
| company_login_id      |         | is_current (BOOLEAN)          |         | description           |     |
| manager_fullname      |         | valid_from / valid_to (DATE)  |         +-----------------------+     |
| manager_login_id      |         | assessed_on (DATE)            |                                       |
+-----------------------+         +-------------------------------+                                       |
        ^                                                                                                 |
        |                         +-------------------------------+         +-----------------------+     |
        +------------------------>|         PERSON_TEAMS          |         |      CATEGORIES       |     |
                                  +-------------------------------+         +-----------------------+     |
                                  | id (PK, UUID)                 |         | id (PK, INT)          |<----+
                                  | person_id (FK -> person)      |         | name                  |
                                  | team_id (FK -> teams)-------->|----+    | description           |
                                  | is_current / valid_from/to    |    |    +-----------------------+
                                  +-------------------------------+    |
                                                                       v
                                  +-------------------------------+ +-----------------------+
                                  |          TEAM_SKILLS          | |         TEAMS         |
                                  +-------------------------------+ +-----------------------+
                                  | id (PK, UUID)                 | | id (PK, INT)          |
                                  | team_id (FK -> teams)---------->| name                  |
                                  | skill_id (FK -> skills)       | | description           |
                                  | is_required (BOOLEAN)         | +-----------------------+
                                  +-------------------------------+
```

```mermaid
erDiagram
    PERSON ||--o{ PERSON_SKILL_ASSESSMENTS : "assessed in"
    SKILLS ||--o{ PERSON_SKILL_ASSESSMENTS : "rated on"
    CATEGORIES ||--o{ SKILLS : "categorizes"
    TEAMS ||--o{ PERSON_TEAMS : "belongs to"
    PERSON ||--o{ PERSON_TEAMS : "assigned to"
    TEAMS ||--o{ TEAM_SKILLS : "requires"
    SKILLS ||--o{ TEAM_SKILLS : "targeted by"

    PERSON {
        uuid id PK
        string full_name
        string role_title
        string email
        string company_login_id
        string manager_fullname
        string manager_company_login_id
        timestamp created_at
    }

    SKILLS {
        uuid id PK
        string name
        int category_id FK
        string vendor
        string description
        timestamp created_at
    }

    CATEGORIES {
        int id PK
        string name
        string description
    }

    TEAMS {
        int id PK
        string name
        string description
        timestamp created_at
    }

    PERSON_SKILL_ASSESSMENTS {
        uuid id PK
        uuid person_id FK
        uuid skill_id FK
        int competency_level_id
        boolean is_current
        date valid_from
        date valid_to
        date assessed_on
        timestamp created_at
    }

    PERSON_TEAMS {
        uuid id PK
        uuid person_id FK
        int team_id FK
        boolean is_current
        date valid_from
        date valid_to
        timestamp created_at
    }

    TEAM_SKILLS {
        uuid id PK
        int team_id FK
        uuid skill_id FK
        boolean is_required
        boolean is_current
        date valid_from
        date valid_to
        timestamp created_at
    }
```

---

### 🌟 Fact Tables vs. Dimension Tables

#### 1. Fact Tables (Event & Assessment Data)
- **`person_skill_assessments` (Periodic Assessment Fact Table)**:
  - **Granularity**: One record per developer assessment event per skill level change.
  - **Measures / Numerical Metrics**: `competency_level_id` (Integer rating from 1 = Basic to 5 = Expert).
  - **Foreign Key Dimensions**: `person_id` (FK -> `person.id`), `skill_id` (FK -> `skills.id`).
  - **Temporal Audit Attributes**: `is_current` (Boolean), `valid_from` (Date), `valid_to` (Date), `assessed_on` (Date).

- **`team_skills` (Team Requirement Fact Table)**:
  - **Granularity**: One record per team required skill rule.
  - **Foreign Key Dimensions**: `team_id` (FK -> `teams.id`), `skill_id` (FK -> `skills.id`).
  - **Attributes**: `is_required` (Boolean), `is_current` (Boolean), `valid_from` (Date), `valid_to` (Date).

- **`person_teams` (Team Assignment Fact / Bridge Table)**:
  - **Granularity**: One record per person team placement period.
  - **Foreign Key Dimensions**: `person_id` (FK -> `person.id`), `team_id` (FK -> `teams.id`).
  - **Attributes**: `is_current` (Boolean), `valid_from` (Date), `valid_to` (Date).

#### 2. Dimension Tables (Context & Attributes)
- **`person` (Developer Dimension)**: Stores personnel context (Full Name, Role Title, Email, Company Login ID, Manager reporting attributes).
- **`skills` (Skill Dimension)**: Stores catalog metadata (Skill Name, Vendor, Description, Foreign Key to Category).
- **`categories` (Taxonomy Dimension)**: Defines higher-level skill domains (Frontend, Backend, Database, DevOps, etc.).
- **`teams` (Organizational Team Dimension)**: Stores team names and descriptions.

---

### 🔑 Key Database Technical Highlights

1. **Surrogate Keys & UUID Primary Keys**:
   - Uses UUID primary keys generated via `gen_random_uuid()` for `person`, `skills`, `person_skill_assessments`, `person_teams`, and `team_skills`. This eliminates key collision issues across distributed environments, APIs, and CSV imports.
   - Uses integer surrogate keys (`SERIAL`) for static lookup dimensions (`categories`, `teams`).

2. **Referential Integrity & Cascading**:
   - Foreign keys enforce strict relational integrity with `ON DELETE CASCADE` clauses (e.g., deleting a person automatically cleans up their assessments and team junction records without leaving orphaned data).

3. **Row-Level Security (RLS)**:
   - All tables enforce PostgreSQL Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Declarative security policies govern public/authenticated read, insert, update, and delete access.

4. **Recommended Database Indexes**:
   For large-scale enterprise deployments, the following composite indexes optimize query performance:
   ```sql
   -- Optimize current active assessment queries for matrix loading
   CREATE INDEX idx_psa_current ON person_skill_assessments (person_id, skill_id) WHERE is_current = true;
   
   -- Optimize historical temporal queries for progress reporting
   CREATE INDEX idx_psa_history ON person_skill_assessments (person_id, valid_from, valid_to);
   
   -- Optimize team member lookups
   CREATE INDEX idx_pt_current ON person_teams (person_id, team_id) WHERE is_current = true;
   ```

---

## 🌟 Core Features & Tab-by-Tab Guide

```
+-----------------------------------------------------------------------------------+
|                            SKILLS MATRIX APPLICATION                              |
+-----------------------------------------------------------------------------------+
|  [Matrix Grid]  |  [Team Members]  |  [Tracked Skills]  |  [Categories]  | [Teams] |
+-----------------------------------------------------------------------------------+
```

The application is structured into **5 main interactive tabs**, each dedicated to a core aspect of skills governance.

---

### Tab 1: 📊 Skills Matrix Grid

The **Skills Matrix Grid** is the primary interactive hub of the application. It displays a dynamic matrix mapping **Team Members (Rows)** against **Tracked Skills (Columns)**.

#### 1. Interactive 5-Star Rating Widget
- Click on stars (1 to 5) to set a developer's proficiency level in real time.
- Click the active star rating again or click the **✕ (reset)** button to revert the rating to **0 stars (None)**.
- Hover over any star to reveal detailed tooltips describing the expectation for that proficiency level.

#### 2. Comprehensive Multi-Facet Filtering
- **Filter by Team**: Multi-select dropdown to view specific teams or all teams.
- **Filter by Team Member**: Focus on specific individuals.
- **Filter by Skill**: Target specific skills across the organization.
- **Filter by Category**: Limit columns to specific skill domain categories (e.g., Frontend, Backend, DevOps).
- **Filter by Vendor**: Filter skills by technology vendors (e.g., Meta, OpenJS, W3C, PostgreSQL Group).
- **Filter by Skill Level**: Isolate developers matching specific proficiency levels (0 to 5).
- **Search Query**: Real-time text search filter for skills.

#### 3. Matrix Sorting & Navigation
- **Sort Developers**: Sort team member rows alphabetically in ascending (`A-Z`) or descending (`Z-A`) order.
- **Team Target Skills Context**: View target/required skills designated for each team, highlighting gaps where team members lack required proficiencies.
- **Inline Skill Addition**: Create a brand-new skill directly from the team view and auto-assign it on the fly.

---

### Tab 2: 👥 Team Members (Developers) Management

The **Team Members** tab manages individual profiles, team assignments, reporting structures, and bulk data operations.

#### 1. Team Member Attributes
Each team member profile maintains:
- **Full Name**: Developer's complete name.
- **Role / Job Title**: Position title (e.g., *Frontend Architect*, *DevOps Specialist*).
- **Email Address**: Corporate email.
- **Assigned Team**: Active team membership.
- **Company Login ID**: Corporate single sign-on or login identifier.
- **Manager Details**: Manager's full name and Manager's company login ID for organizational reporting trees.

#### 2. Member Roster Management
- **Add Team Member**: Dedicated form to onboard new personnel into teams.
- **Edit Member**: Inline row editing for updating roles, emails, teams, or reporting managers.
- **Delete Member**: Safe deletion with confirmation alerts.
- **Interactive Profile Modal**: Click any member's name or detail trigger to pop open a rich side modal detailing their profile, team info, manager details, and complete skill rating breakdown.

#### 3. CSV Import & Export Capabilities
- **CSV Export**: Download the complete team member roster as a CSV file (`team_members_YYYY-MM-DD.csv`).
- **Smart CSV Import**: Bulk upload team members from CSV files.
  - **Auto-Delimiter Detection**: Intelligent parsing for `,` (comma), `;` (semicolon), and `\t` (tab).
  - **BOM Handling**: Automatically strips UTF-8 Byte Order Marks.
  - **Flexible Column Auto-Mapping**: Matches headers regardless of naming variations (`Full Name`, `Name`, `Developer Name`, `Role`, `Job Title`, `Email`, `Team`, `Company Login ID`, `Manager`).
  - **Resilient Fallback Execution**: Auto-recovers if non-critical database constraints or missing optional fields occur during upload.

---

### Tab 3: 📚 Tracked Skills Inventory

The **Tracked Skills** tab acts as the master technical catalog of your organization.

#### 1. Catalog Attributes & Metrics
- **Skill Name**: Unique name of the technology or competency (e.g., *React*, *Docker*, *PostgreSQL*).
- **Category**: Associated domain category (e.g., *Frontend*, *Database*, *DevOps*).
- **Vendor / Publisher**: Creator or maintaining body (e.g., *Meta*, *Docker Inc.*, *OpenJS Foundation*).
- **Description**: Detailed explanation of the skill scope.
- **Average Proficiency Rating**: Live calculated average star rating across all assessed developers.
- **Proficient Developers Count**: Number of team members possessing a rating of Basic or above.

#### 2. Skill Management
- **Add New Skill**: Define skill name, category, vendor, and description.
- **Edit Skill**: Modify existing skill attributes across the app.
- **Delete Skill**: Removes skill from catalog and cleans up assessments.

---

### Tab 4: 🏷️ Skill Categories Taxonomy

The **Categories** tab organizes skills into domain groups.

- **Pre-configured Defaults**: *Frontend*, *Backend*, *Database*, *DevOps*, *Design*, *Other*.
- **Category Metrics**: Displays the total count of tracked skills contained within each category.
- **Category CRUD**: Add custom categories, edit names/descriptions, and delete unused categories.

---

### Tab 5: 🏢 Teams Governance & Skill Requirements

The **Teams** tab manages operational teams and defines target skill profiles required for each team.

#### 1. Team Administration
- Create, edit, and delete teams.
- View real-time member counts per team.
- Expand team rows to inspect team member rosters and assigned skills simultaneously.
- **Line Item Close Controls**: Convenient top header and bottom action bar "Close Line Item / Done" buttons and table row toggle button to quickly collapse the expanded team line item when finished editing.

#### 2. Target Skill Assignment & Skill Gaps
- **Assign/Remove Required Skills**: Toggle skills to define the expected technical stack for a team.
- **"Add Skill on the Fly"**: Create a new skill directly inside a team drawer and automatically bind it as a required team skill in a single step.

---

## 🕒 Temporal Audit Model & Progress Tracking (Historical Record Preservation)

To enable managers to track team progress and skill development over time, the database implements a **Temporal Data Model / Slowly Changing Dimension (SCD Type 2)** design across assessment tables (`person_skill_assessments`, `person_teams`, `team_skills`).

### 1. `is_current` Flagging Mechanism
When a skill level is added or updated for a developer:
- **Current Active Record (`is_current = true`)**: The active record representing the developer's current proficiency level.
- **Historical Superceded Records (`is_current = false`)**: 
  1. The application executes an `UPDATE` on the previous active record setting `is_current = false`, `valid_to = YYYY-MM-DD`, and `updated_at = NOW()`.
  2. A new `INSERT` is executed creating a new record with `is_current = true`, `valid_from = YYYY-MM-DD`, `assessed_on = YYYY-MM-DD`, and `competency_level_id = X`.

```
Timeline of Skill Assessments (e.g. John Doe - React):
+-----------------------------------------------------------------------------------------------+
| ID | Person | Skill | Level | is_current | valid_from | valid_to   | Description              |
+----+--------+-------+-------+------------+------------+------------+--------------------------+
| #1 | John   | React | 1     | FALSE      | 2026-01-01 | 2026-04-15 | Initial Assessment       |
| #2 | John   | React | 3     | FALSE      | 2026-04-15 | 2026-08-23 | Mid-Year Progress Review |
| #3 | John   | React | 4     | TRUE       | 2026-08-23 | NULL       | Active Current Rating    |
+-----------------------------------------------------------------------------------------------+
```

### 2. Benefits for Future Team Progress Reporting
- **Audit Traceability**: Immutable log of who changed what rating and when.
- **Skill Growth & Velocity Tracking**: Managers can visualize how a developer or team progressed over quarters (e.g., 2 stars -> 4 stars).
- **Time-Travel Snapshots**: Query the exact state of team skills as of any historical date by filtering records where `valid_from <= target_date AND (valid_to IS NULL OR valid_to > target_date)`.

---

## ⚡ Connection Modes & Database Setup

The application features dual-mode architecture:

```
                  +-----------------------------------+
                  |   Skills Matrix Application       |
                  +-----------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
        [ 🟢 Supabase Mode ]              [ 🟡 Demo Mode ]
       Connected to Postgres               Pre-loaded Mock Data
       Real-time persistence               Zero setup required
```

### 1. 🟡 Autonomous Demo Mode
- Activated automatically when Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are omitted or unreachable.
- Uses mock datasets covering sample developers (*Sarah Connor*, *John Doe*, *Ada Lovelace*, *Bruce Wayne*), core skills (*React*, *Node.js*, *PostgreSQL*, *Docker*), categories, and team assignments.
- Enables instant testing, demonstration, and evaluation of all features without setting up external infrastructure.

### 2. 🟢 Supabase Database Connection
- Connects directly to a cloud PostgreSQL instance via `@supabase/supabase-js`.
- Features real-time connection status indicators (**Checking**, **Connected**, **Partial**, **Error**).

#### Built-in SQL Setup Script
- Click the **Copy SQL Setup Script** button in the connection status panel to copy the complete schema creation script.
- The script automatically creates:
  - `person` table (team members)
  - `skills` table
  - `categories` table
  - `person_skill_assessments` table (with `is_current`, `valid_from`, `valid_to`, `assessed_on`)
  - `teams` table
  - `person_teams` join table
  - `team_skills` required skills table
  - Row Level Security (RLS) policies allowing secure public read/write access for demo deployments

---

## ⭐ Competency Level Scale Reference

| Level | Rating | Label | Description & Criteria |
| :---: | :---: | :--- | :--- |
| **0** | ☆☆☆☆☆ | **0 – None** | No prior experience or knowledge of the skill. |
| **1** | ★☆☆☆☆ | **1 – Basic** | Can follow step-by-step examples and tutorials; requires active guidance. |
| **2** | ★★☆☆☆ | **2 – Emerging** | Completes simple tasks independently; familiar with core syntax and concepts. |
| **3** | ★★★☆☆ | **3 – Competent** | Works independently on routine tasks; writes production-ready code for standard scenarios. |
| **4** | ★★★★☆ | **4 – Strong** | Solves complex architectural problems, optimizes performance, and mentors junior team members. |
| **5** | ★★★★★ | **5 – Expert** | Deep mastery; defines engineering standards, authors internal libraries, and teaches organization-wide. |

---

## 📖 Step-by-Step User Workflows

### Workflow 1: Initializing the System
1. Launch the app. If running without Supabase keys, click **Demo Mode** to pre-populate with test data.
2. If connecting to Supabase, paste the SQL script into your Supabase SQL Editor and click **Run**. Refresh the app to establish live database connection.

### Workflow 2: Onboarding Team Members via CSV
1. Navigate to **Team Members**.
2. Click **Export CSV** to download a template or reference roster.
3. Prepare a CSV file containing `Full Name`, `Role`, `Email`, `Team`, `Company Login ID`, `Manager Full Name`.
4. Click **Import CSV** and select your file. The system automatically detects delimiters, matches columns, and populates your team roster.

### Workflow 3: Defining Team Skill Requirements
1. Navigate to **Teams**.
2. Expand a team row (e.g., *BI Development*).
3. Click on skills in the catalog matrix to assign them as required skills for that team.
4. Alternatively, click **Add Skill on the fly** to create and assign a new skill immediately.

### Workflow 4: Assessing Team Proficiency & Preserving Progress History
1. Navigate to **Skills Matrix Grid**.
2. Select a team filter to focus on your team.
3. Click the star ratings corresponding to each team member and skill cell to record or update competency levels.
4. When updating a rating, the application marks the previous record as `is_current = false` with `valid_to = YYYY-MM-DD`, and inserts a new active record with `is_current = true` and `valid_from = YYYY-MM-DD`, maintaining a permanent progress history for team reporting.

---

## 🛠️ File Structure Reference

```
SkillsMatrix/
├── index.html              # App entry point
├── package.json            # Vite, React 19, Supabase JS, Lucide icons dependencies
├── vite.config.js          # Vite build & server config
├── USER_GUIDE.md           # Full User Guide & Feature Documentation
└── src/
    ├── App.jsx             # Main Application Logic, State, Tabs, Controls & Renderers
    ├── App.css             # Supplementary styling
    ├── index.css           # Glassmorphism Design System, Tokens, CSS Variables
    ├── main.jsx            # React root DOM renderer
    └── lib/
        └── supabaseClient.js # Supabase client initialization & env config
```
