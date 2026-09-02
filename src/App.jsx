import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from './lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import pkg from '../package.json';

const APP_VERSION = `v${pkg.version}`;
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  UserPlus, 
  Activity, 
  LayoutGrid, 
  Users, 
  Briefcase, 
  BookOpen, 
  Settings, 
  RefreshCw, 
  ChevronRight, 
  Check, 
  Copy,
  Trash2,
  Star,
  X,
  ArrowUp,
  ArrowDown,
  Info,
  Download,
  Upload,
  FileText,
  Printer
} from 'lucide-react';

// Predefined mock data for Demo Mode
const mockDevelopers = [
  { id: 'dev-1', name: 'Sarah Connor', role: 'Frontend Architect' },
  { id: 'dev-2', name: 'John Doe', role: 'Backend Developer' },
  { id: 'dev-3', name: 'Ada Lovelace', role: 'Lead Systems Engineer' },
  { id: 'dev-4', name: 'Bruce Wayne', role: 'DevOps Specialist' }
];

const mockSkills = [
  { id: 'skill-1', name: 'React', category: 'Frontend', category_id: 1, vendor: 'Meta', description: 'JavaScript library for building user interfaces' },
  { id: 'skill-2', name: 'Node.js', category: 'Backend', category_id: 2, vendor: 'OpenJS Foundation', description: 'JavaScript runtime built on Chrome\'s V8 engine' },
  { id: 'skill-3', name: 'PostgreSQL', category: 'Database', category_id: 3, vendor: 'PostgreSQL Global Development Group', description: 'Powerful, open source object-relational database' },
  { id: 'skill-4', name: 'Docker', category: 'DevOps', category_id: 4, vendor: 'Docker Inc.', description: 'Containerization platform' },
  { id: 'skill-5', name: 'CSS Grid & Flexbox', category: 'Frontend', category_id: 1, vendor: 'W3C', description: 'CSS layout methodologies' }
];

const mockCategories = [
  { id: 1, name: 'Frontend', description: 'User interface development' },
  { id: 2, name: 'Backend', description: 'Server logic and APIs' },
  { id: 3, name: 'Database', description: 'Data modeling and storage' },
  { id: 4, name: 'DevOps', description: 'Deployment and infrastructure' },
  { id: 5, name: 'Design', description: 'UI/UX and visual styling' },
  { id: 6, name: 'Other', description: 'Miscellaneous skills' }
];

const mockDeveloperSkills = [
  { developer_id: 'dev-1', skill_id: 'skill-1', level: 'Expert' },
  { developer_id: 'dev-1', skill_id: 'skill-5', level: 'Expert' },
  { developer_id: 'dev-1', skill_id: 'skill-2', level: 'Competent' },
  { developer_id: 'dev-2', skill_id: 'skill-2', level: 'Expert' },
  { developer_id: 'dev-2', skill_id: 'skill-3', level: 'Strong' },
  { developer_id: 'dev-2', skill_id: 'skill-1', level: 'Basic' },
  { developer_id: 'dev-3', skill_id: 'skill-3', level: 'Strong' },
  { developer_id: 'dev-3', skill_id: 'skill-4', level: 'Emerging' },
  { developer_id: 'dev-4', skill_id: 'skill-4', level: 'Expert' }
];

const mockTeams = [
  { id: 1, name: 'BI Development' },
  { id: 2, name: 'Frontend Engineering' },
  { id: 3, name: 'Core Platform' }
];

const mockPersonTeams = [
  { person_id: 'dev-1', team_id: 1, is_current: true },
  { person_id: 'dev-2', team_id: 2, is_current: true },
  { person_id: 'dev-3', team_id: 3, is_current: true },
  { person_id: 'dev-4', team_id: 1, is_current: true }
];

const mockTeamSkills = [
  { id: 'ts-1', team_id: 1, skill_id: 'skill-2' },
  { id: 'ts-2', team_id: 1, skill_id: 'skill-3' },
  { id: 'ts-3', team_id: 2, skill_id: 'skill-1' },
  { id: 'ts-4', team_id: 2, skill_id: 'skill-5' },
  { id: 'ts-5', team_id: 3, skill_id: 'skill-3' },
  { id: 'ts-6', team_id: 3, skill_id: 'skill-4' }
];

const SQL_SETUP_SCRIPT = `-- 1. Create person table (team members)
CREATE TABLE IF NOT EXISTS person (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role_title TEXT DEFAULT 'Software Engineer',
  email TEXT,
  company_login_id TEXT,
  manager_fullname TEXT,
  manager_company_login_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 3. Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  vendor TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create person_skill_assessments table with temporal audit history
-- Active assessment records are flagged as is_current = true.
-- When a skill level is added or updated, previous records are flagged as is_current = false with valid_to set to today,
-- and a new record is inserted with is_current = true. This preserves team progress history over time for future reporting.
CREATE TABLE IF NOT EXISTS person_skill_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  competency_level_id INTEGER NOT NULL CHECK (competency_level_id BETWEEN 1 AND 5),
  is_current BOOLEAN DEFAULT true NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE NOT NULL,
  valid_to DATE,
  assessed_on DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create person_teams join table
CREATE TABLE IF NOT EXISTS person_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  is_current BOOLEAN DEFAULT true NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create team_skills join table
CREATE TABLE IF NOT EXISTS team_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true NOT NULL,
  is_current BOOLEAN DEFAULT true NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_skills ENABLE ROW LEVEL SECURITY;

-- 9. Create policies to allow public read/write (for this demo app)
CREATE POLICY "Allow public read person" ON person FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert person" ON person FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update person" ON person FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete person" ON person FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert categories" ON categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON categories FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete categories" ON categories FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read skills" ON skills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert skills" ON skills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update skills" ON skills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete skills" ON skills FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read person_skill_assessments" ON person_skill_assessments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert person_skill_assessments" ON person_skill_assessments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update person_skill_assessments" ON person_skill_assessments FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete person_skill_assessments" ON person_skill_assessments FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read teams" ON teams FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert teams" ON teams FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update teams" ON teams FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete teams" ON teams FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read person_teams" ON person_teams FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert person_teams" ON person_teams FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update person_teams" ON person_teams FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete person_teams" ON person_teams FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read team_skills" ON team_skills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert team_skills" ON team_skills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update team_skills" ON team_skills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete team_skills" ON team_skills FOR DELETE TO public USING (true);`;

// Detailed mapping of competency levels
const levelDetails = {
  'None': { label: '0 – None', desc: 'No experience at all' },
  'Basic': { label: '1 – Basic', desc: 'Can follow examples, needs guidance' },
  'Emerging': { label: '2 – Emerging', desc: 'Can complete simple tasks independently' },
  'Competent': { label: '3 – Competent', desc: 'Can work independently on most tasks' },
  'Strong': { label: '4 – Strong', desc: 'Can solve complex problems and guide others' },
  'Expert': { label: '5 – Expert', desc: 'Deep mastery, teaches others, sets standards' }
};

// Custom Star Rating Component
const StarRating = ({ value, onChange, disabled }) => {
  const [hoverValue, setHoverValue] = useState(null);
  
  const levels = ['None', 'Basic', 'Emerging', 'Competent', 'Strong', 'Expert'];
  const currentValueIdx = levels.indexOf(value);
  const displayValue = hoverValue !== null ? hoverValue : currentValueIdx;
  
  return (
    <div 
      className="star-rating-container"
      onMouseLeave={() => !disabled && setHoverValue(null)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFilled = starIdx <= displayValue;
          const levelName = levels[starIdx];
          const detail = levelDetails[levelName] || {};
          
          return (
            <button
              key={starIdx}
              type="button"
              disabled={disabled}
              onClick={() => {
                const nextLevel = currentValueIdx === starIdx ? 'None' : levelName;
                onChange(nextLevel);
              }}
              onMouseEnter={() => !disabled && setHoverValue(starIdx)}
              title={`${detail.label}: ${detail.desc}`}
              className={`star-button ${isFilled ? 'active' : ''}`}
            >
              <Star
                size={18}
                className="star-icon"
              />
            </button>
          );
        })}
      </div>
      
      {currentValueIdx > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('None')}
          title="Reset to 0 stars (None)"
          className="star-reset-button"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

function App() {
  // App states
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, error, partial
  const [errorMessage, setErrorMessage] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  
  // Data states
  const [developers, setDevelopers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [developerSkills, setDeveloperSkills] = useState([]);
  const [teams, setTeams] = useState([]);
  const [personTeams, setPersonTeams] = useState([]);
  const [teamSkills, setTeamSkills] = useState([]);
  const [categories, setCategories] = useState([]);

  // Sorting and Filter states
  const [activeTab, setActiveTab] = useState('matrix'); // matrix, developers, skills
  const [matrixSortOrder, setMatrixSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedTeamNames, setSelectedTeamNames] = useState([]); // Array of team names e.g. ['BI Development'], empty = All
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [selectedDevIds, setSelectedDevIds] = useState([]); // Array of dev IDs e.g. ['dev-1'], empty = All
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]); // Array of skill IDs for multi-select
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [selectedLevelFilters, setSelectedLevelFilters] = useState([]); // Array of numbers e.g. [4, 5], empty or 6 items = All
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([]); // Array of category names, empty = All
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedVendorNames, setSelectedVendorNames] = useState([]); // Array of vendor names, empty = All
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [devListSortOrder, setDevListSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedDevListTeamNames, setSelectedDevListTeamNames] = useState([]); // Array of team names, empty = All
  const [isDevListTeamDropdownOpen, setIsDevListTeamDropdownOpen] = useState(false);
  const [selectedDevListRoleNames, setSelectedDevListRoleNames] = useState([]); // Array of role titles, empty = All
  const [isDevListRoleDropdownOpen, setIsDevListRoleDropdownOpen] = useState(false);
  const [skillsSortOrder, setSkillsSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [categoriesSortOrder, setCategoriesSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [teamsSortOrder, setTeamsSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [showInlineAddSkillTeamId, setShowInlineAddSkillTeamId] = useState(null);
  const [inlineSkillName, setInlineSkillName] = useState('');
  const [inlineSkillVendor, setInlineSkillVendor] = useState('');
  const [inlineSkillDescription, setInlineSkillDescription] = useState('');
  const [inlineSkillCategoryId, setInlineSkillCategoryId] = useState('');
  const [showInlineAddMemberTeamId, setShowInlineAddMemberTeamId] = useState(null);
  const [inlineMemberName, setInlineMemberName] = useState('');
  const [inlineMemberRole, setInlineMemberRole] = useState('Developer');
  const [inlineMemberEmail, setInlineMemberEmail] = useState('');
  const [selectedDevInfo, setSelectedDevInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineContext, setTimelineContext] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Column Resizer State & Handlers
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColKey, setResizingColKey] = useState(null);

  const handleResizeStart = (e, colKey, initialWidth = 150, minWidth = 60) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || initialWidth;
    setResizingColKey(colKey);
    document.body.classList.add('is-resizing-col');

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColumnWidths(prev => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      setResizingColKey(null);
      document.body.classList.remove('is-resizing-col');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const getColStyle = (colKey, defaultWidth) => {
    const width = columnWidths[colKey] || defaultWidth;
    if (!width) return {};
    return {
      width: `${width}px`,
      minWidth: `${width}px`,
      maxWidth: `${width}px`,
      boxSizing: 'border-box'
    };
  };

  const ColumnResizer = ({ colKey, defaultWidth = 150, minWidth = 60 }) => (
    <div
      className={`col-resizer-handle ${resizingColKey === colKey ? 'resizing' : ''}`}
      onMouseDown={(e) => handleResizeStart(e, colKey, defaultWidth, minWidth)}
      onClick={(e) => e.stopPropagation()}
      title="Drag to resize column width"
    />
  );

  // Button refs for Portal Dropdown Positioning
  const teamBtnRef = useRef(null);
  const devBtnRef = useRef(null);
  const skillBtnRef = useRef(null);
  const levelBtnRef = useRef(null);
  const devListTeamBtnRef = useRef(null);
  const devListRoleBtnRef = useRef(null);
  const categoryBtnRef = useRef(null);
  const vendorBtnRef = useRef(null);

  const getPortalDropdownStyle = (buttonRef) => {
    if (typeof window === 'undefined' || window.innerWidth <= 900) {
      return {};
    }
    if (!buttonRef || !buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      minWidth: `${Math.max(rect.width, 240)}px`,
      maxWidth: '320px',
      zIndex: 99999
    };
  };

  useEffect(() => {
    const isAnyOpen = isTeamDropdownOpen || isDevDropdownOpen || isSkillDropdownOpen || isLevelDropdownOpen || isDevListTeamDropdownOpen || isDevListRoleDropdownOpen || isCategoryDropdownOpen || isVendorDropdownOpen;
    if (isAnyOpen && typeof window !== 'undefined' && window.innerWidth <= 900) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isTeamDropdownOpen, isDevDropdownOpen, isSkillDropdownOpen, isLevelDropdownOpen, isDevListTeamDropdownOpen, isDevListRoleDropdownOpen, isCategoryDropdownOpen, isVendorDropdownOpen]);

  // Form states
  const [newDevName, setNewDevName] = useState('');
  const [newDevRole, setNewDevRole] = useState('');
  const [newDevEmail, setNewDevEmail] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillVendor, setNewSkillVendor] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillCategoryId, setNewSkillCategoryId] = useState('');
  const [newDevManagerName, setNewDevManagerName] = useState('');
  const [newDevManagerCompanyLoginId, setNewDevManagerCompanyLoginId] = useState('');
  const [newDevCompanyLoginId, setNewDevCompanyLoginId] = useState('');
  const [newDevTeamId, setNewDevTeamId] = useState('');

  // Editing Developer States
  const [editingDevId, setEditingDevId] = useState(null);
  const [editDevName, setEditDevName] = useState('');
  const [editDevRole, setEditDevRole] = useState('');
  const [editDevEmail, setEditDevEmail] = useState('');
  const [editDevManagerName, setEditDevManagerName] = useState('');
  const [editDevManagerCompanyLoginId, setEditDevManagerCompanyLoginId] = useState('');
  const [editDevCompanyLoginId, setEditDevCompanyLoginId] = useState('');
  const [editDevTeamId, setEditDevTeamId] = useState('');

  // Teams CRUD form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [teamRedirectTarget, setTeamRedirectTarget] = useState(null); // 'developers' or 'matrix'

  // Skills CRUD states
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editSkillName, setEditSkillName] = useState('');
  const [editSkillVendor, setEditSkillVendor] = useState('');
  const [editSkillDescription, setEditSkillDescription] = useState('');
  const [editSkillCategoryId, setEditSkillCategoryId] = useState('');

  // Categories CRUD states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');

  // Trigger Toast Notification
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Copy SQL Script Helper
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopied(true);
    showToast('SQL Script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Test Supabase Connection and Load Data
  const checkConnectionAndLoad = async (forceDemo = false) => {
    if (forceDemo) {
      setDevelopers(mockDevelopers.map(row => {
        const currentPT = mockPersonTeams.find(pt => pt.person_id === row.id && pt.is_current === true);
        const teamObj = currentPT ? mockTeams.find(t => t.id === currentPT.team_id) : null;
        return {
          ...row,
          team: teamObj ? teamObj.name : 'No Team',
          teamId: teamObj ? teamObj.id : null
        };
      }));
      setSkills(mockSkills);
      setDeveloperSkills(mockDeveloperSkills);
      setTeams(mockTeams);
      setPersonTeams(mockPersonTeams);
      setTeamSkills(mockTeamSkills);
      setCategories(mockCategories);
      if (mockCategories.length > 0) {
        setNewSkillCategoryId(mockCategories[0].id);
      }
      setConnectionStatus('partial');
      setUseDemoMode(true);
      showToast('Loaded Demo Mode with mock data');
      return;
    }

    setConnectionStatus('checking');
    setLoading(true);
    setErrorMessage('');

    try {
      if (!supabase) {
        throw new Error('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing. Please add them to your Vercel project environment variables to connect your database.');
      }

      // 1. Query person to see if table exists
      const { data: devsData, error: devsError } = await supabase
        .from('person')
        .select('*');

      if (devsError) {
        if (devsError.code === 'PGRST205' || devsError.message.includes('does not exist')) {
          throw new Error('Supabase project exists, but your "person" table is missing.');
        }
        throw devsError;
      }

      // 2. Query categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      if (categoriesError) throw categoriesError;

      // 3. Query skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*');
      if (skillsError) throw skillsError;

      // 4. Query person_skill_assessments junction (active rows only)
      const { data: junctionData, error: junctionError } = await supabase
        .from('person_skill_assessments')
        .select('*')
        .eq('is_current', true);
      if (junctionError) throw junctionError;

      // 5. Query teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');
      if (teamsError) throw teamsError;

      // 6. Query person_teams
      const { data: personTeamsData, error: personTeamsError } = await supabase
        .from('person_teams')
        .select('*');
      if (personTeamsError) throw personTeamsError;

      // 7. Query team_skills junction (active rows where is_current is true)
      let fetchedTeamSkills = [];
      try {
        const { data: tsData, error: tsError } = await supabase
          .from('team_skills')
          .select('*')
          .eq('is_current', true);
        if (!tsError && tsData) {
          fetchedTeamSkills = tsData;
        }
      } catch (tsErr) {
        console.log('team_skills table query notice:', tsErr);
      }

      // Map DB schema to app state
      const mappedDevs = (devsData || []).map(row => {
        const currentPT = (personTeamsData || []).find(pt => pt.person_id === row.id && pt.is_current === true);
        const teamObj = currentPT ? (teamsData || []).find(t => t.id === currentPT.team_id) : null;
        return {
          id: row.id,
          name: row.full_name,
          role: row.role_title || 'Software Engineer',
          email: row.email,
          team: teamObj ? teamObj.name : 'No Team',
          teamId: teamObj ? teamObj.id : null,
          managerName: row.manager_fullname,
          managerCompanyLoginId: row.manager_company_login_id,
          companyLoginId: row.company_login_id
        };
      });

      const mappedSkills = (skillsData || []).map(row => {
        const cat = (categoriesData || []).find(c => c.id === row.category_id);
        return {
          id: row.id,
          name: row.name,
          category: cat ? cat.name : 'Other',
          category_id: row.category_id,
          vendor: row.vendor || '',
          description: row.description || ''
        };
      });

      const levels = ['None', 'Basic', 'Emerging', 'Competent', 'Strong', 'Expert'];
      const mappedJunction = (junctionData || []).map(row => ({
        developer_id: row.person_id,
        skill_id: row.skill_id,
        level: levels[row.competency_level_id] || 'None'
      }));

      setDevelopers(mappedDevs);
      setSkills(mappedSkills);
      setDeveloperSkills(mappedJunction);
      setTeams(teamsData || []);
      setPersonTeams(personTeamsData || []);
      setTeamSkills(fetchedTeamSkills);
      setCategories(categoriesData || []);
      if (categoriesData && categoriesData.length > 0) {
        setNewSkillCategoryId(categoriesData[0].id);
      }
      setConnectionStatus('connected');
      setUseDemoMode(false);
      showToast('Connected to your Supabase project tables successfully!');
    } catch (err) {
      console.error('Supabase connection error:', err);
      setErrorMessage(err.message || 'Unable to connect to database');
      setConnectionStatus('error');
      
      // Fallback to Demo Mode so the app still renders beautifully
      setDevelopers(mockDevelopers.map(row => {
        const currentPT = mockPersonTeams.find(pt => pt.person_id === row.id && pt.is_current === true);
        const teamObj = currentPT ? mockTeams.find(t => t.id === currentPT.team_id) : null;
        return {
          ...row,
          team: teamObj ? teamObj.name : 'No Team',
          teamId: teamObj ? teamObj.id : null
        };
      }));
      setSkills(mockSkills);
      setDeveloperSkills(mockDeveloperSkills);
      setTeams(mockTeams);
      setPersonTeams(mockPersonTeams);
      setCategories(mockCategories);
      setUseDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionAndLoad();
  }, []);

  // CRUD: Add a Developer (Person)
  const handleAddDeveloper = async (e) => {
    e.preventDefault();
    if (!newDevName || !newDevRole) return;

    setLoading(true);
    if (useDemoMode) {
      let assignedTeamName = 'No Team';
      let assignedTeamId = null;
      if (newDevTeamId) {
        const teamObj = teams.find(t => String(t.id) === String(newDevTeamId));
        if (teamObj) {
          assignedTeamName = teamObj.name;
          assignedTeamId = teamObj.id;
        }
      }
      const newDev = {
        id: `dev-${Date.now()}`,
        name: newDevName,
        role: newDevRole,
        email: newDevEmail,
        team: assignedTeamName,
        teamId: assignedTeamId
      };
      setDevelopers([...developers, newDev]);
      setNewDevName('');
      setNewDevRole('');
      setNewDevEmail('');
      setNewDevTeamId('');
      
      // Auto-navigate back to Matrix and set filters
      setActiveTab('matrix');
      setSelectedTeamFilter(assignedTeamName);
      setSelectedDevFilter(newDev.id);
      
      showToast(`Added ${newDevName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const devPayload = {
        full_name: newDevName
      };
      if (newDevRole) devPayload.role_title = newDevRole;
      if (newDevEmail) devPayload.email = newDevEmail;
      if (newDevManagerName) devPayload.manager_fullname = newDevManagerName;
      if (newDevManagerCompanyLoginId) devPayload.manager_company_login_id = newDevManagerCompanyLoginId;
      if (newDevCompanyLoginId) devPayload.company_login_id = newDevCompanyLoginId;

      let { data, error } = await supabase
        .from('person')
        .insert([devPayload])
        .select();

      if (error && (error.message.includes('role') || error.code === '23503' || error.code === '42703')) {
        delete devPayload.role_title;
        const retryRes = await supabase
          .from('person')
          .insert([devPayload])
          .select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error && (error.message.includes('company_login_id') || error.message.includes('people_company_login_id_format_check'))) {
        delete devPayload.company_login_id;
        delete devPayload.manager_company_login_id;
        const retryRes = await supabase
          .from('person')
          .insert([devPayload])
          .select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;

      const newRow = data[0];
      
      let assignedTeamName = 'No Team';
      let assignedTeamId = null;
      if (newDevTeamId) {
        const tId = parseInt(newDevTeamId);
        const todayStr = new Date().toISOString().split('T')[0];
        const { error: ptErr } = await supabase
          .from('person_teams')
          .insert([{
            person_id: newRow.id,
            team_id: tId,
            is_current: true,
            valid_from: todayStr
          }]);
        if (ptErr) throw ptErr;

        const teamObj = teams.find(t => t.id === tId);
        if (teamObj) {
          assignedTeamName = teamObj.name;
          assignedTeamId = teamObj.id;
        }
      }

      const newDevMapped = {
        id: newRow.id,
        name: newRow.full_name,
        role: newRow.role_title || 'Software Engineer',
        email: newRow.email,
        team: assignedTeamName,
        teamId: assignedTeamId,
        managerName: newRow.manager_fullname,
        managerCompanyLoginId: newRow.manager_company_login_id,
        companyLoginId: newRow.company_login_id
      };

      setDevelopers([...developers, newDevMapped]);
      setNewDevName('');
      setNewDevRole('');
      setNewDevEmail('');
      setNewDevManagerName('');
      setNewDevManagerCompanyLoginId('');
      setNewDevCompanyLoginId('');
      setNewDevTeamId('');
      
      // Auto-navigate back to Matrix and set filters
      setActiveTab('matrix');
      setSelectedTeamNames([assignedTeamName]);
      setSelectedDevIds([newDevMapped.id]);
      
      showToast(`Successfully added team member: ${newDevName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error adding team member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export Team Members to CSV
  const handleExportDevelopers = () => {
    if (developers.length === 0) {
      showToast('No team members to export');
      return;
    }

    const headers = ['Full Name', 'Role', 'Email', 'Team', 'Company Login ID', 'Manager Full Name', 'Manager Company Login ID'];
    const csvRows = [headers.join(',')];

    developers.forEach(dev => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      const row = [
        escape(dev.name),
        escape(dev.role),
        escape(dev.email),
        escape(dev.team === 'No Team' ? '' : dev.team),
        escape(dev.companyLoginId),
        escape(dev.managerName),
        escape(dev.managerCompanyLoginId)
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `team_members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported team members to CSV!');
  };

  // Documentation Export to Word (.doc)
  const handleExportDocx = () => {
    const docBody = document.getElementById('doc-modal-body');
    if (!docBody) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Skills Matrix Application - User Guide & Architecture Documentation</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; background-color: #ffffff; }
          h1 { color: #5b21b6; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px; font-size: 24pt; margin-top: 0; }
          h2 { color: #6d28d9; margin-top: 28px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; font-size: 18pt; }
          h3 { color: #7c3aed; margin-top: 20px; font-size: 14pt; }
          h4 { color: #0f172a; margin-top: 16px; font-size: 12pt; }
          table { border-collapse: collapse; width: 100%; margin: 18px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 10pt; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: Consolas, monospace; font-size: 9.5pt; color: #0f172a; }
          pre { background-color: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; overflow-x: auto; font-family: Consolas, monospace; font-size: 9.5pt; }
          .badge { background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 8.5pt; font-weight: bold; }
        </style>
      </head>
      <body>
        ${docBody.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SkillsMatrix_User_Guide_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Documentation as Word Document (.doc)!');
  };

  // Documentation Export to Markdown (.md)
  const handleExportMarkdown = () => {
    const markdownContent = `# Skills Matrix Application — User Guide & Feature Documentation

Welcome to the **Skills Matrix Application**, a modern, interactive web application engineered to track, manage, analyze, and visualize technical skills, team competencies, and capability gaps across your organization.

---

## 📋 Executive Overview

The **Skills Matrix Application** provides engineering managers, team leads, and HR leaders with complete visibility into the technical capabilities of their organization. By mapping team members against a catalog of tracked skills and competency levels (from 0 to 5 stars), the application enables data-driven decision-making for:

- **Resource Allocation & Project Staffing**: Quickly locate team members with specific technical mastery (e.g., Expert in React or Strong in PostgreSQL).
- **Skill Gap Identification**: Contrast team skill requirements against actual team capabilities to identify training needs or hiring priorities.
- **Team Capability Benchmarking**: Measure category-level and team-level proficiency metrics in real time.
- **Data Management & Governance**: Seamlessly import/export team rosters and connect to PostgreSQL via Supabase with full Row-Level Security (RLS).
- **Historical Progress Tracking**: Preserve immutable rating change histories using temporal boolean flags (\`is_current = true / false\`) to enable long-term team growth reports.

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

\`\`\`ascii
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
\`\`\`

\`\`\`mermaid
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
\`\`\`

---

### 🌟 Fact Tables vs. Dimension Tables

#### 1. Fact Tables (Event & Assessment Data)
- **\`person_skill_assessments\` (Periodic Assessment Fact Table)**:
  - **Granularity**: One record per developer assessment event per skill level change.
  - **Measures / Numerical Metrics**: \`competency_level_id\` (Integer rating from 1 = Basic to 5 = Expert).
  - **Foreign Key Dimensions**: \`person_id\` (FK -> \`person.id\`), \`skill_id\` (FK -> \`skills.id\`).
  - **Temporal Audit Attributes**: \`is_current\` (Boolean), \`valid_from\` (Date), \`valid_to\` (Date), \`assessed_on\` (Date).

- **\`team_skills\` (Team Requirement Fact Table)**:
  - **Granularity**: One record per team required skill rule.
  - **Foreign Key Dimensions**: \`team_id\` (FK -> \`teams.id\`), \`skill_id\` (FK -> \`skills.id\`).
  - **Attributes**: \`is_required\` (Boolean), \`is_current\` (Boolean), \`valid_from\` (Date), \`valid_to\` (Date).

- **\`person_teams\` (Team Assignment Fact / Bridge Table)**:
  - **Granularity**: One record per person team placement period.
  - **Foreign Key Dimensions**: \`person_id\` (FK -> \`person.id\`), \`team_id\` (FK -> \`teams.id\`).
  - **Attributes**: \`is_current\` (Boolean), \`valid_from\` (Date), \`valid_to\` (Date).

#### 2. Dimension Tables (Context & Attributes)
- **\`person\` (Developer Dimension)**: Stores personnel context (Full Name, Role Title, Email, Company Login ID, Manager reporting attributes).
- **\`skills\` (Skill Dimension)**: Stores catalog metadata (Skill Name, Vendor, Description, Foreign Key to Category).
- **\`categories\` (Taxonomy Dimension)**: Defines higher-level skill domains (Frontend, Backend, Database, DevOps, etc.).
- **\`teams\` (Organizational Team Dimension)**: Stores team names and descriptions.

---

### 🔑 Key Database Technical Highlights

1. **Surrogate Keys & UUID Primary Keys**:
   - Uses UUID primary keys generated via \`gen_random_uuid()\` for \`person\`, \`skills\`, \`person_skill_assessments\`, \`person_teams\`, and \`team_skills\`. This eliminates key collision issues across distributed environments, APIs, and CSV imports.
   - Uses integer surrogate keys (\`SERIAL\`) for static lookup dimensions (\`categories\`, \`teams\`).

2. **Referential Integrity & Cascading**:
   - Foreign keys enforce strict relational integrity with \`ON DELETE CASCADE\` clauses (e.g., deleting a person automatically cleans up their assessments and team junction records without leaving orphaned data).

3. **Row-Level Security (RLS)**:
   - All tables enforce PostgreSQL Row-Level Security (\`ALTER TABLE ... ENABLE ROW LEVEL SECURITY\`).
   - Declarative security policies govern public/authenticated read, insert, update, and delete access.

4. **Recommended Database Indexes**:
   For large-scale enterprise deployments, the following composite indexes optimize query performance:
   \`\`\`sql
   -- Optimize current active assessment queries for matrix loading
   CREATE INDEX idx_psa_current ON person_skill_assessments (person_id, skill_id) WHERE is_current = true;
   
   -- Optimize historical temporal queries for progress reporting
   CREATE INDEX idx_psa_history ON person_skill_assessments (person_id, valid_from, valid_to);
   
   -- Optimize team member lookups
   CREATE INDEX idx_pt_current ON person_teams (person_id, team_id) WHERE is_current = true;
   \`\`\`

---

## 📱 Navigation Tabs Menu Bar Overview

The application features a top navigation bar containing **6 primary interactive tabs**. The bar uses a dark glassmorphism design system, active tab highlighting, Lucide React icons, and dynamic real-time count badges that update live as data is added or modified.

\`\`\`
+-------------------------------------------------------------------------------------------------------+
|                                      SKILLS MATRIX APPLICATION                                        |
+-------------------------------------------------------------------------------------------------------+
| [📊 Matrix Grid] | [👥 Team Members (4)] | [📚 Tracked Skills (5)] | [🏷️ Categories (6)] | [🏢 Teams (3)] | [📖 User Guide] |
+-------------------------------------------------------------------------------------------------------+
\`\`\`

### 🏷️ Tabs Menu Items Specification

| Menu Item | Tab Key | Icon | Badge / Counter | Primary Responsibility |
| :--- | :---: | :---: | :---: | :--- |
| **Skills Matrix Grid** | \`matrix\` | \`<LayoutGrid />\` | — | Interactive 5-star competency rating matrix mapping developers against skills with multi-facet filtering and column resizing. |
| **Team Members** | \`developers\` | \`<Users />\` | \`(N)\` Total Members | Roster directory, developer profile attributes, reporting manager details, side profile modal, and CSV Import/Export engine. |
| **Tracked Skills** | \`skills\` | \`<BookOpen />\` | \`(N)\` Total Skills | Master technical catalog, technology vendors, average star ratings, proficient developer counts, and skill CRUD operations. |
| **Categories** | \`categories\` | \`<LayoutGrid />\` | \`(N)\` Total Categories | Taxonomy domain management grouping technical competencies (Frontend, Backend, Database, DevOps, etc.). |
| **Teams** | \`teams\` | \`<Briefcase />\` | \`(N)\` Total Teams | Operational team administration, required skill assignment, roster member management, and target capability gap tracking. |
| **User Guide & Docs** | \`docs\` | \`<BookOpen />\` | Specs Portal | Comprehensive in-app technical user guide, Star Schema specifications, SCD Type 2 audit documentation, and 1-click export toolbar. |

### 🧭 Navigation & Interface Behaviors
- **Active State Highlighting**: The currently selected tab is visually emphasized with an active glow background (\`var(--accent-primary-alpha)\`), clear borders, and high-contrast text.
- **Dynamic Entity Count Badges**: Menu item titles for *Team Members*, *Tracked Skills*, *Categories*, and *Teams* automatically display live count badges reflecting real-time database query results.
- **Responsive Overflow Scrolling**: On mobile devices and narrow viewports, the tab navigation bar enables smooth horizontal touch scrolling while preserving tab alignment.
- **State Preservation Across Tabs**: Switching between tabs retains all active filters, matrix scroll positions, and unsaved form states without requiring page reloads.

---

## 🌟 Core Features & Tab-by-Tab Guide

---

### Tab 1: 📊 Skills Matrix Grid (\`matrix\`)

The **Skills Matrix Grid** is the primary interactive hub of the application. It displays a dynamic matrix mapping **Team Members (Rows)** against **Tracked Skills (Columns)** with 5-star proficiency widgets.

#### 1. Interactive 5-Star Rating Widget
- **Star Rating Range**: Click on stars (1 to 5) to instantly evaluate a developer's proficiency level in real time.
- **Rating Reset Controls**: Click the active star rating again or click the **✕ (reset)** button to revert the rating to **0 stars (None)**.
- **Interactive Level Tooltips**: Hover over any star to reveal detailed tooltips describing the exact performance expectations for that competency level (0: None, 1: Basic, 2: Emerging, 3: Competent, 4: Strong, 5: Expert).

#### 2. Comprehensive Multi-Facet Filtering Engine
The matrix grid includes a multi-select filtering panel to slice data across 7 dimensions:
- **Filter by Team**: Multi-select dropdown to filter developer rows by specific teams (or view all teams).
- **Filter by Team Member**: Multi-select dropdown to focus on specific developers.
- **Filter by Skill**: Multi-select dropdown to isolate specific skills across the grid.
- **Filter by Category**: Multi-select dropdown to limit columns to technical domain categories (e.g., *Frontend*, *Backend*, *DevOps*).
- **Filter by Vendor**: Multi-select dropdown to filter skills by technology vendors (e.g., *Meta*, *OpenJS*, *W3C*, *PostgreSQL Group*).
- **Filter by Skill Level**: Multi-select dropdown to isolate developers matching specific star ratings (0 to 5).
- **Real-Time Skill Search**: Instant text search box to filter skill columns by query string on the fly.

#### 3. Matrix Sorting, Column Resizing, & Gap Analysis
- **Interactive Drag & Resize Columns**: Drag the vertical resizer handle on the right edge of any table column header (\`<th>\`) to dynamically adjust column widths across all grids and management tables in real time.
- **Developer Name Sorting**: Toggle developer row sorting alphabetically in ascending (\`A-Z\`) or descending (\`Z-A\`) order.
- **Team Target Skills Context**: Visual indicator badges highlight target skills designated for each team, making it easy to identify capability gaps where team members fall below target standards.
- **Inline Skill Creation**: Create a brand-new skill directly from the matrix view and auto-assign it to the catalog on the fly.

---

### Tab 2: 👥 Team Members (Developers) Management (\`developers\`)

The **Team Members** tab manages individual profiles, organizational reporting structures, team placements, and bulk roster import/export operations.

#### 1. Personnel Profile Attributes
Each developer profile maintains full organizational metadata:
- **Full Name**: Developer's complete name.
- **Role / Job Title**: Position title (e.g., *Frontend Architect*, *DevOps Specialist*, *Senior Backend Engineer*).
- **Email Address**: Corporate email address.
- **Assigned Team**: Active operational team membership.
- **Company Login ID**: Corporate single sign-on (SSO) or login handle.
- **Manager Details**: Reporting manager's full name and manager's company login ID for organizational reporting trees.

#### 2. Roster Management Controls
- **Add Team Member Form**: Dedicated onboarding form to add personnel into teams with role, email, SSO ID, and manager reporting structure.
- **Inline Row Editing**: Update roles, email, team assignment, or manager information directly inside table rows.
- **Delete Member**: Safe deletion with confirmation modal dialogs and cascading DB cleanups.
- **Table Filtering & Sorting**: Multi-select filtering by Team and Role, plus name sorting (A-Z / Z-A).

#### 3. Interactive Member Profile Modal
- Click any developer's name or detail icon to pop open a rich side profile modal.
- Displays full contact details, assigned team, SSO ID, reporting manager hierarchy, and a complete breakdown of all rated skills with 5-star widgets.

#### 4. Smart CSV Import & Export Engine
- **CSV Export**: Download the complete team roster as a CSV file (\`team_members_YYYY-MM-DD.csv\`).
- **Smart CSV Import**: Bulk upload team members from standard CSV files:
  - **Auto-Delimiter Detection**: Parses CSV files formatted with commas (\`,\`), semicolons (\`;\`), or tabs (\`\\t\`).
  - **BOM Handling**: Automatically strips UTF-8 Byte Order Marks to prevent encoding issues.
  - **Flexible Column Auto-Mapping**: Automatically matches headers regardless of naming variations (\`Full Name\`, \`Name\`, \`Developer Name\`, \`Role\`, \`Job Title\`, \`Email\`, \`Team\`, \`Company Login ID\`, \`Manager\`).
  - **Resilient Fallback Execution**: Auto-recovers if non-critical database constraints or missing optional fields occur during upload.

---

### Tab 3: 📚 Tracked Skills Inventory (\`skills\`)

The **Tracked Skills** tab acts as the master technical catalog of your organization.

#### 1. Catalog Attributes & Live Metrics
- **Skill Name**: Unique name of the technology or competency (e.g., *React*, *Node.js*, *PostgreSQL*, *Docker*).
- **Category**: Associated domain category (e.g., *Frontend*, *Backend*, *Database*, *DevOps*).
- **Vendor / Publisher**: Creator or maintaining organization (e.g., *Meta*, *Docker Inc.*, *OpenJS Foundation*).
- **Description**: Detailed description of the skill scope.
- **Average Proficiency Rating**: Live calculated average star rating across all assessed team members.
- **Proficient Developers Count**: Total count of developers possessing a rating of 1 star (Basic) or higher.

#### 2. Skill Catalog CRUD & Navigation
- **Add New Skill**: Create catalog entries specifying name, category, vendor, and description.
- **Edit Skill**: Modify existing skill attributes across the application.
- **Delete Skill**: Removes skill from catalog and cleans up related assessments via cascading database deletes.
- **Category Badges**: Click category badges inside the table to navigate directly to the filtered category domain.

---

### Tab 4: 🏷️ Skill Categories Taxonomy (\`categories\`)

The **Categories** tab manages the high-level taxonomy domain structure used to organize skills into technical discipline groups.

#### 1. Domain Taxonomy Structure
- **Pre-configured Taxonomy Defaults**: *Frontend*, *Backend*, *Database*, *DevOps*, *Design*, *Other*.
- **Category Skill Metrics**: Real-time counter displaying total tracked skills contained within each domain category.

#### 2. Taxonomy CRUD Operations
- **Add Custom Category**: Define new technical domain groups with custom names and descriptions.
- **Edit Category**: Update category titles and domain definitions.
- **Delete Category**: Delete unused categories safely with integrity checking.

---

### Tab 5: 🏢 Teams Governance & Skill Requirements (\`teams\`)

The **Teams** tab manages operational teams, roster placements, and target skill profiles required for each team.

#### 1. Team Administration & Roster Overview
- **Team CRUD**: Create, edit, and delete operational teams.
- **Team Summary Metrics**: Real-time developer roster counts and target required skill counts per team.
- **Alphabetical Sorting**: Sort teams list by name (A-Z / Z-A).

#### 2. Expanded Team Drawer & Line Item Controls
Expanding any team row opens a detailed management drawer:
- **Target Skill Assignment Engine**: Select skills from the catalog to assign or unassign them as required team competencies.
- **"Add Skill on the Fly"**: Create a brand-new skill directly inside the team drawer and automatically bind it as a required team skill in a single step.
- **Direct Team Member Assignment ("Add Member")**: Select existing roster developers from a dropdown picker to assign or reassign them to the team.
- **"Add Member on the Fly"**: Create a brand-new developer profile (Full Name, Role Title, Email) directly inside the team drawer and auto-assign them to the team.
- **Unassign Team Member**: Click the remove icon next to any listed developer to unassign them from the team.
- **Line Item Close Controls**: Top header \`[✕] Close Line Item\` and table row toggle buttons to collapse the expanded team line item view.

---

### Tab 6: 📖 User Guide & System Specifications (\`docs\`)

The **User Guide & System Specifications** tab embeds this complete technical documentation portal directly inside the application interface.

#### 1. Interactive Export Toolbar
Located at the top of the documentation panel, the toolbar provides 1-click documentation export options:
- **Export Word (.doc)**: Download a formatted Microsoft Word document version of the documentation (\`Skills_Matrix_User_Guide_YYYY-MM-DD.doc\`).
- **Export Markdown (.md)**: Download the raw Markdown source code file (\`Skills_Matrix_User_Guide.md\`).
- **Print / PDF**: Launch the browser print dialog optimized with CSS print media styles to save or print as a clean PDF document.

#### 2. Comprehensive System Documentation Content
Renders all architectural and operational specifications:
- Executive Overview & Business Value
- System Architecture & Glassmorphism Design System
- Star Schema ERD Diagrams & Complete Database Table Specifications
- Fact Tables vs. Dimension Tables Analysis
- PostgreSQL Database Indexing & RLS Policies
- Temporal Audit Model (SCD Type 2) & Skill History Tracking
- Dual Database Connection Modes (Supabase PostgreSQL vs Autonomous Demo Mode)
- 5-Star Competency Rating Scale Matrix
- Complete Navigation Tabs Menu Bar Overview & 6-Tab Interactive Guide
- Step-by-Step User Workflows & File Structure Reference

---

## 🕒 Temporal Audit Model & Progress Tracking (Historical Record Preservation)

To enable managers to track team progress and skill development over time, the database implements a **Temporal Data Model / Slowly Changing Dimension (SCD Type 2)** design across assessment tables (\`person_skill_assessments\`, \`person_teams\`, \`team_skills\`).

### 1. \`is_current\` Flagging Mechanism
When a skill level is added or updated for a developer:
- **Current Active Record (\`is_current = true\`)**: The active record representing the developer's current proficiency level.
- **Historical Superceded Records (\`is_current = false\`)**: 
  1. The application executes an \`UPDATE\` on the previous active record setting \`is_current = false\`, \`valid_to = YYYY-MM-DD\`, and \`updated_at = NOW()\`.
  2. A new \`INSERT\` is executed creating a new record with \`is_current = true\`, \`valid_from = YYYY-MM-DD\`, \`assessed_on = YYYY-MM-DD\`, and \`competency_level_id = X\`.

\`\`\`
Timeline of Skill Assessments (e.g. John Doe - React):
+-----------------------------------------------------------------------------------------------+
| ID | Person | Skill | Level | is_current | valid_from | valid_to   | Description              |
+----+--------+-------+-------+------------+------------+------------+--------------------------+
| #1 | John   | React | 1     | FALSE      | 2026-01-01 | 2026-04-15 | Initial Assessment       |
| #2 | John   | React | 3     | FALSE      | 2026-04-15 | 2026-08-23 | Mid-Year Progress Review |
| #3 | John   | React | 4     | TRUE       | 2026-08-23 | NULL       | Active Current Rating    |
+-----------------------------------------------------------------------------------------------+
\`\`\`

### 2. Benefits for Future Team Progress Reporting
- **Audit Traceability**: Immutable log of who changed what rating and when.
- **Skill Growth & Velocity Tracking**: Managers can visualize how a developer or team progressed over quarters (e.g., 2 stars -> 4 stars).
- **Time-Travel Snapshots**: Query the exact state of team skills as of any historical date by filtering records where \`valid_from <= target_date AND (valid_to IS NULL OR valid_to > target_date)\`.

---

## ⚡ Connection Modes & Database Setup

The application features dual-mode architecture:

\`\`\`
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
\`\`\`

### 1. 🟡 Autonomous Demo Mode
- Activated automatically when Supabase credentials (\`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_ANON_KEY\`) are omitted or unreachable.
- Uses mock datasets covering sample developers (*Sarah Connor*, *John Doe*, *Ada Lovelace*, *Bruce Wayne*), core skills (*React*, *Node.js*, *PostgreSQL*, *Docker*), categories, and team assignments.
- Enables instant testing, demonstration, and evaluation of all features without setting up external infrastructure.

### 2. 🟢 Supabase Database Connection
- Connects directly to a cloud PostgreSQL instance via \`@supabase/supabase-js\`.
- Features real-time connection status indicators (**Checking**, **Connected**, **Partial**, **Error**).

#### Built-in SQL Setup Script
- Click the **Copy SQL Setup Script** button in the connection status panel to copy the complete schema creation script.
- The script automatically creates:
  - \`person\` table (team members)
  - \`skills\` table
  - \`categories\` table
  - \`person_skill_assessments\` table (with \`is_current\`, \`valid_from\`, \`valid_to\`, \`assessed_on\`)
  - \`teams\` table
  - \`person_teams\` join table
  - \`team_skills\` required skills table
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
3. Prepare a CSV file containing \`Full Name\`, \`Role\`, \`Email\`, \`Team\`, \`Company Login ID\`, \`Manager Full Name\`.
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
4. When updating a rating, the application marks the previous record as \`is_current = false\` with \`valid_to = YYYY-MM-DD\`, and inserts a new active record with \`is_current = true\` and \`valid_from = YYYY-MM-DD\`, maintaining a permanent progress history for team reporting.

---

## 🛠️ File Structure Reference

\`\`\`
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
\`\`\`
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SkillsMatrix_User_Guide_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Complete Documentation as Markdown (.md)!');
  };

  // Print Documentation to PDF
  const handlePrintPdf = () => {
    const docBody = document.getElementById('doc-modal-body');
    if (!docBody) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popup permissions to print PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Skills Matrix Application - User Guide & Documentation</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #0f172a; padding: 2.5rem; background: #ffffff; }
          h1 { color: #5b21b6; border-bottom: 2px solid #8b5cf6; padding-bottom: 0.5rem; font-size: 2rem; margin-top: 0; }
          h2 { color: #6d28d9; margin-top: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem; font-size: 1.4rem; }
          h3 { color: #7c3aed; margin-top: 1.5rem; font-size: 1.15rem; }
          table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; page-break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 0.9rem; }
          th { background: #f1f5f9; font-weight: 600; }
          tr:nth-child(even) { background: #f8fafc; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; }
          pre { background: #0f172a; color: #f8fafc; padding: 1rem; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 0.85rem; page-break-inside: avoid; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${docBody.innerHTML}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper to parse CSV text line supporting comma, semicolon, or tab delimiters and quotes
  const parseCSVLine = (textLine, delimiter = ',') => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < textLine.length; i++) {
      const char = textLine[i];
      if (char === '"') {
        if (inQuotes && textLine[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // Import Team Members from CSV
  const handleImportDevelopers = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        let text = evt.target.result || '';
        // Strip UTF-8 BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row.');
        }

        // Auto-detect delimiter (comma, semicolon, or tab)
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semiCount = (headerLine.match(/;/g) || []).length;
        const tabCount = (headerLine.match(/\t/g) || []).length;

        let delimiter = ',';
        if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
        if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

        const rawHeaders = parseCSVLine(headerLine, delimiter);
        const headerTokens = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Flexible matching for header column indexes
        const findIdx = (keywords) => headerTokens.findIndex(h => keywords.some(k => h.includes(k)));

        const nameIdx = findIdx(['fullname', 'full', 'name', 'developername', 'membername', 'person']);
        const roleIdx = findIdx(['role', 'title', 'position', 'job']);
        const emailIdx = findIdx(['email', 'emailaddress', 'mail']);
        const teamIdx = findIdx(['team', 'teamname', 'group']);
        const companyLoginIdx = findIdx(['companyloginid', 'companylogin', 'loginid', 'login', 'username', 'userid']);
        const mgrNameIdx = findIdx(['managerfullname', 'managername', 'manager']);
        const mgrLoginIdx = findIdx(['managercompanyloginid', 'managerlogin', 'managercompanylogin']);

        if (nameIdx === -1) {
          throw new Error(`Could not find a name column in CSV headers: [${rawHeaders.join(', ')}]. Expected "Full Name" or "Name".`);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let insertedCount = 0;
        let updatedCount = 0;
        let lastError = null;

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i], delimiter);
          const fullName = cols[nameIdx];
          if (!fullName) continue;

          const roleTitle = (roleIdx !== -1 && cols[roleIdx] && cols[roleIdx].trim()) ? cols[roleIdx].trim() : 'Software Engineer';
          const email = (emailIdx !== -1 && cols[emailIdx] && cols[emailIdx].trim()) ? cols[emailIdx].trim() : null;
          const teamNameRaw = (teamIdx !== -1 && cols[teamIdx] && cols[teamIdx].trim()) ? cols[teamIdx].trim() : '';
          const companyLoginId = (companyLoginIdx !== -1 && cols[companyLoginIdx] && cols[companyLoginIdx].trim()) ? cols[companyLoginIdx].trim() : null;
          const managerName = (mgrNameIdx !== -1 && cols[mgrNameIdx] && cols[mgrNameIdx].trim()) ? cols[mgrNameIdx].trim() : null;
          const managerLoginId = (mgrLoginIdx !== -1 && cols[mgrLoginIdx] && cols[mgrLoginIdx].trim()) ? cols[mgrLoginIdx].trim() : null;

          const matchedTeam = teamNameRaw 
            ? teams.find(t => t.name.toLowerCase() === teamNameRaw.toLowerCase()) 
            : null;

          if (useDemoMode) {
            const existing = developers.find(d => d.name.toLowerCase() === fullName.toLowerCase());
            if (existing) {
              setDevelopers(prev => prev.map(d => d.id === existing.id ? { 
                ...d, 
                role: roleTitle, 
                email: email || d.email, 
                team: matchedTeam ? matchedTeam.name : (teamNameRaw || d.team),
                teamId: matchedTeam ? matchedTeam.id : d.teamId,
                companyLoginId: companyLoginId || d.companyLoginId,
                managerName: managerName || d.managerName,
                managerCompanyLoginId: managerLoginId || d.managerCompanyLoginId
              } : d));
              updatedCount++;
            } else {
              setDevelopers(prev => [...prev, {
                id: `dev-imp-${Date.now()}-${i}`,
                name: fullName,
                role: roleTitle,
                email: email || '',
                team: matchedTeam ? matchedTeam.name : (teamNameRaw || 'No Team'),
                teamId: matchedTeam ? matchedTeam.id : null,
                companyLoginId,
                managerName,
                managerCompanyLoginId: managerLoginId
              }]);
              insertedCount++;
            }
          } else {
            const insertPayload = { full_name: fullName };
            if (roleTitle) insertPayload.role_title = roleTitle;
            if (email) insertPayload.email = email;
            if (companyLoginId) insertPayload.company_login_id = companyLoginId;
            if (managerName) insertPayload.manager_fullname = managerName;
            if (managerLoginId) insertPayload.manager_company_login_id = managerLoginId;

            const existing = developers.find(d => d.name.toLowerCase() === fullName.toLowerCase());
            
            let data, error;
            if (existing) {
              const res = await supabase.from('person').update(insertPayload).eq('id', existing.id).select();
              data = res.data; error = res.error;
            } else {
              const res = await supabase.from('person').insert([insertPayload]).select();
              data = res.data; error = res.error;
            }

            if (error && (error.message.includes('role') || error.code === '23503' || error.code === '42703')) {
              delete insertPayload.role_title;
              const retryRes = existing 
                ? await supabase.from('person').update(insertPayload).eq('id', existing.id).select()
                : await supabase.from('person').insert([insertPayload]).select();
              data = retryRes.data; error = retryRes.error;
            }

            if (error && (error.message.includes('company_login_id') || error.message.includes('people_company_login_id_format_check'))) {
              delete insertPayload.company_login_id;
              delete insertPayload.manager_company_login_id;
              const retryRes = existing 
                ? await supabase.from('person').update(insertPayload).eq('id', existing.id).select()
                : await supabase.from('person').insert([insertPayload]).select();
              data = retryRes.data; error = retryRes.error;
            }

            if (error) {
              console.error(`Error importing row ${i} (${fullName}):`, error);
              lastError = error;
              continue;
            }

            const returnedPerson = data[0];
            let assignedTeamName = existing ? existing.team : 'No Team';
            let assignedTeamId = existing ? existing.teamId : null;

            if (matchedTeam) {
              // Update team if changed, simplified logic for import to avoid checking all past person_teams
              await supabase.from('person_teams').insert([{
                person_id: returnedPerson.id,
                team_id: matchedTeam.id,
                is_current: true,
                valid_from: todayStr
              }]);
              assignedTeamName = matchedTeam.name;
              assignedTeamId = matchedTeam.id;
            }

            const updatedDevObj = {
              id: returnedPerson.id,
              name: returnedPerson.full_name,
              role: returnedPerson.role_title || roleTitle,
              email: returnedPerson.email || email,
              team: assignedTeamName,
              teamId: assignedTeamId,
              managerName: returnedPerson.manager_fullname,
              managerCompanyLoginId: returnedPerson.manager_company_login_id,
              companyLoginId: returnedPerson.company_login_id
            };

            if (existing) {
              setDevelopers(prev => prev.map(d => d.id === existing.id ? updatedDevObj : d));
              updatedCount++;
            } else {
              setDevelopers(prev => [...prev, updatedDevObj]);
              insertedCount++;
            }
          }
        }

        if (insertedCount > 0 || updatedCount > 0) {
          showToast(`Successfully imported members: ${insertedCount} new, ${updatedCount} updated!`);
        } else if (lastError) {
          showToast(`Import failed: ${lastError.message}`);
        } else {
          showToast('Import complete: 0 rows found to import.');
        }
      } catch (err) {
        console.error(err);
        showToast(`Import error: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = ''; // Reset file input
      }
    };

    reader.readAsText(file);
  };


  // --- Export / Import for Skills ---
  const handleExportSkills = () => {
    if (skills.length === 0) {
      showToast('No skills to export');
      return;
    }
    const headers = ['Name', 'Vendor', 'Description', 'Category'];
    const csvRows = [headers.join(',')];
    skills.forEach(s => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      const catName = categories.find(c => c.id === s.category_id)?.name || '';
      csvRows.push([escape(s.name), escape(s.vendor), escape(s.description), escape(catName)].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `skills_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported skills to CSV!');
  };

  const handleImportSkills = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let text = evt.target.result || '';
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV file must contain a header row and at least one data row.');
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semiCount = (headerLine.match(/;/g) || []).length;
        const tabCount = (headerLine.match(/\t/g) || []).length;
        let delimiter = ',';
        if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
        if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
        const rawHeaders = parseCSVLine(headerLine, delimiter);
        const headerTokens = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const findIdx = (keywords) => headerTokens.findIndex(h => keywords.some(k => h.includes(k)));
        
        const nameIdx = findIdx(['name', 'skill']);
        const vendorIdx = findIdx(['vendor', 'provider']);
        const descIdx = findIdx(['description', 'desc']);
        const catIdx = findIdx(['category']);
        
        if (nameIdx === -1) throw new Error(`Could not find a name column in CSV headers.`);
        
        let insertedCount = 0;
        let updatedCount = 0;
        let lastError = null;
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i], delimiter);
          const name = cols[nameIdx];
          if (!name) continue;
          const vendor = vendorIdx !== -1 ? cols[vendorIdx] : '';
          const description = descIdx !== -1 ? cols[descIdx] : '';
          const catName = catIdx !== -1 ? cols[catIdx] : '';
          
          let matchedCat = categories.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
          
          if (useDemoMode) {
            const existing = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              setSkills(prev => prev.map(s => s.id === existing.id ? { ...s, vendor, description, category_id: matchedCat ? matchedCat.id : s.category_id, category: matchedCat ? matchedCat.name : s.category } : s));
              updatedCount++;
            } else {
              setSkills(prev => [...prev, { id: `skill-imp-${Date.now()}-${i}`, name, vendor, description, category_id: matchedCat ? matchedCat.id : null, category: matchedCat ? matchedCat.name : '' }]);
              insertedCount++;
            }
          } else {
            const insertPayload = { name };
            if (vendor) insertPayload.vendor = vendor;
            if (description) insertPayload.description = description;
            if (matchedCat) insertPayload.category_id = matchedCat.id;
            
            const existing = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              const { data, error } = await supabase.from('skills').update(insertPayload).eq('id', existing.id).select();
              if (error) { lastError = error; continue; }
              setSkills(prev => prev.map(s => s.id === existing.id ? data[0] : s));
              updatedCount++;
            } else {
              const { data, error } = await supabase.from('skills').insert([insertPayload]).select();
              if (error) { lastError = error; continue; }
              setSkills(prev => [...prev, data[0]]);
              insertedCount++;
            }
          }
        }
        if (insertedCount > 0 || updatedCount > 0) showToast(`Successfully imported skills: ${insertedCount} new, ${updatedCount} updated!`);
        else if (lastError) showToast(`Import failed: ${lastError.message}`);
        else showToast('Import complete: 0 rows found to import.');
      } catch (err) {
        console.error(err);
        showToast(`Import error: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- Export / Import for Categories ---
  const handleExportCategories = () => {
    if (categories.length === 0) {
      showToast('No categories to export');
      return;
    }
    const headers = ['Name', 'Description'];
    const csvRows = [headers.join(',')];
    categories.forEach(c => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      csvRows.push([escape(c.name), escape(c.description)].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported categories to CSV!');
  };

  const handleImportCategories = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let text = evt.target.result || '';
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV file must contain a header row and at least one data row.');
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semiCount = (headerLine.match(/;/g) || []).length;
        const tabCount = (headerLine.match(/\t/g) || []).length;
        let delimiter = ',';
        if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
        if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
        const rawHeaders = parseCSVLine(headerLine, delimiter);
        const headerTokens = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const findIdx = (keywords) => headerTokens.findIndex(h => keywords.some(k => h.includes(k)));
        
        const nameIdx = findIdx(['name', 'category']);
        const descIdx = findIdx(['description', 'desc']);
        
        if (nameIdx === -1) throw new Error(`Could not find a name column in CSV headers.`);
        
        let insertedCount = 0;
        let updatedCount = 0;
        let lastError = null;
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i], delimiter);
          const name = cols[nameIdx];
          if (!name) continue;
          const description = descIdx !== -1 ? cols[descIdx] : '';
          
          if (useDemoMode) {
            const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              setCategories(prev => prev.map(c => c.id === existing.id ? { ...c, description } : c));
              updatedCount++;
            } else {
              setCategories(prev => [...prev, { id: Date.now() + i, name, description }]);
              insertedCount++;
            }
          } else {
            const insertPayload = { name };
            if (description) insertPayload.description = description;
            
            const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              const { data, error } = await supabase.from('categories').update(insertPayload).eq('id', existing.id).select();
              if (error) { lastError = error; continue; }
              setCategories(prev => prev.map(c => c.id === existing.id ? data[0] : c));
              updatedCount++;
            } else {
              const { data, error } = await supabase.from('categories').insert([insertPayload]).select();
              if (error) { lastError = error; continue; }
              setCategories(prev => [...prev, data[0]]);
              insertedCount++;
            }
          }
        }
        if (insertedCount > 0 || updatedCount > 0) showToast(`Successfully imported categories: ${insertedCount} new, ${updatedCount} updated!`);
        else if (lastError) showToast(`Import failed: ${lastError.message}`);
        else showToast('Import complete: 0 rows found to import.');
      } catch (err) {
        console.error(err);
        showToast(`Import error: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- Export / Import for Teams ---
  const handleExportTeams = () => {
    if (teams.length === 0) {
      showToast('No teams to export');
      return;
    }
    const headers = ['Name', 'Description'];
    const csvRows = [headers.join(',')];
    teams.forEach(t => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      csvRows.push([escape(t.name), escape(t.description)].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `teams_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported teams to CSV!');
  };

  const handleImportTeams = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let text = evt.target.result || '';
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV file must contain a header row and at least one data row.');
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semiCount = (headerLine.match(/;/g) || []).length;
        const tabCount = (headerLine.match(/\t/g) || []).length;
        let delimiter = ',';
        if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
        if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
        const rawHeaders = parseCSVLine(headerLine, delimiter);
        const headerTokens = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const findIdx = (keywords) => headerTokens.findIndex(h => keywords.some(k => h.includes(k)));
        
        const nameIdx = findIdx(['name', 'team']);
        const descIdx = findIdx(['description', 'desc']);
        
        if (nameIdx === -1) throw new Error(`Could not find a name column in CSV headers.`);
        
        let insertedCount = 0;
        let updatedCount = 0;
        let lastError = null;
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i], delimiter);
          const name = cols[nameIdx];
          if (!name) continue;
          const description = descIdx !== -1 ? cols[descIdx] : '';
          
          if (useDemoMode) {
            const existing = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              setTeams(prev => prev.map(t => t.id === existing.id ? { ...t, description } : t));
              updatedCount++;
            } else {
              setTeams(prev => [...prev, { id: Date.now() + i, name, description }]);
              insertedCount++;
            }
          } else {
            const insertPayload = { name };
            if (description) insertPayload.description = description;
            
            const existing = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              const { data, error } = await supabase.from('teams').update(insertPayload).eq('id', existing.id).select();
              if (error) { lastError = error; continue; }
              setTeams(prev => prev.map(t => t.id === existing.id ? data[0] : t));
              updatedCount++;
            } else {
              const { data, error } = await supabase.from('teams').insert([insertPayload]).select();
              if (error) { lastError = error; continue; }
              setTeams(prev => [...prev, data[0]]);
              insertedCount++;
            }
          }
        }
        if (insertedCount > 0 || updatedCount > 0) showToast(`Successfully imported teams: ${insertedCount} new, ${updatedCount} updated!`);
        else if (lastError) showToast(`Import failed: ${lastError.message}`);
        else showToast('Import complete: 0 rows found to import.');
      } catch (err) {
        console.error(err);
        showToast(`Import error: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // CRUD: Update a Developer (Person)
  const handleUpdateDeveloper = async (devId) => {
    if (!editDevName || !editDevRole) return;
    setLoading(true);

    if (useDemoMode) {
      setDevelopers(developers.map(d => d.id === devId ? { ...d, name: editDevName, role: editDevRole, email: editDevEmail } : d));
      setEditingDevId(null);
      showToast(`Updated member details (Demo)`);
      setLoading(false);
      return;
    }

    const oldDev = developers.find(d => d.id === devId);
    const oldTeamId = oldDev ? oldDev.teamId : null;
    const newTeamId = editDevTeamId ? parseInt(editDevTeamId) : null;

    if (useDemoMode) {
      let teamName = 'No Team';
      if (newTeamId) {
        const teamObj = teams.find(t => t.id === newTeamId);
        if (teamObj) teamName = teamObj.name;
      }
      setDevelopers(developers.map(d => d.id === devId ? { 
        ...d, 
        name: editDevName, 
        role: editDevRole, 
        email: editDevEmail,
        team: teamName,
        teamId: newTeamId,
        managerName: editDevManagerName,
        managerCompanyLoginId: editDevManagerCompanyLoginId,
        companyLoginId: editDevCompanyLoginId
      } : d));
      setEditingDevId(null);
      showToast(`Updated member details (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('person')
        .update({ 
          full_name: editDevName, 
          role_title: editDevRole, 
          email: editDevEmail || null,
          manager_fullname: editDevManagerName || null,
          manager_company_login_id: editDevManagerCompanyLoginId || null,
          company_login_id: editDevCompanyLoginId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', devId);

      if (error) throw error;

      if (oldTeamId !== newTeamId) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (oldTeamId) {
          await supabase
            .from('person_teams')
            .update({ 
              is_current: false, 
              valid_to: todayStr,
              updated_at: new Date().toISOString()
            })
            .eq('person_id', devId)
            .eq('team_id', oldTeamId)
            .eq('is_current', true);
        }

        if (newTeamId) {
          await supabase
            .from('person_teams')
            .insert([{
              person_id: devId,
              team_id: newTeamId,
              is_current: true,
              valid_from: todayStr
            }]);
        }
      }

      let teamName = 'No Team';
      if (newTeamId) {
        const teamObj = teams.find(t => t.id === newTeamId);
        if (teamObj) teamName = teamObj.name;
      }

      setDevelopers(developers.map(d => d.id === devId ? { 
        ...d, 
        name: editDevName, 
        role: editDevRole, 
        email: editDevEmail,
        team: teamName,
        teamId: newTeamId,
        managerName: editDevManagerName,
        managerCompanyLoginId: editDevManagerCompanyLoginId,
        companyLoginId: editDevCompanyLoginId
      } : d));
      setEditingDevId(null);
      showToast(`Successfully updated team member: ${editDevName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error updating team member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Delete a Developer (Person)
  const handleDeleteDeveloper = async (devId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}? This will delete all of their skill assessments.`)) return;
    setLoading(true);

    if (useDemoMode) {
      setDevelopers(developers.filter(d => d.id !== devId));
      setDeveloperSkills(developerSkills.filter(ds => ds.developer_id !== devId));
      if (String(selectedDevFilter) === String(devId)) {
        setSelectedDevFilter('All');
      }
      showToast(`Removed ${name} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('person')
        .delete()
        .eq('id', devId);

      if (error) throw error;

      setDevelopers(developers.filter(d => d.id !== devId));
      setDeveloperSkills(developerSkills.filter(ds => ds.developer_id !== devId));
      if (String(selectedDevFilter) === String(devId)) {
        setSelectedDevFilter('All');
      }
      showToast(`Successfully removed team member: ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Error deleting team member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Add a Skill (Competency)
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName || !newSkillCategoryId) return;

    setLoading(true);
    if (useDemoMode) {
      const catObj = categories.find(c => String(c.id) === String(newSkillCategoryId));
      const newSkill = {
        id: `skill-${Date.now()}`,
        name: newSkillName,
        vendor: newSkillVendor,
        description: newSkillDescription,
        category: catObj ? catObj.name : 'Other',
        category_id: parseInt(newSkillCategoryId)
      };
      setSkills([...skills, newSkill]);
      setNewSkillName('');
      setNewSkillVendor('');
      setNewSkillDescription('');
      showToast(`Added skill: ${newSkillName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const catId = parseInt(newSkillCategoryId);
      const { data: skillData, error: skillError } = await supabase
        .from('skills')
        .insert([{ 
          name: newSkillName, 
          category_id: catId,
          vendor: newSkillVendor || null,
          description: newSkillDescription || null
        }])
        .select();

      if (skillError) throw skillError;

      const catObj = categories.find(c => c.id === catId);
      const newSkillMapped = {
        id: skillData[0].id,
        name: skillData[0].name,
        vendor: skillData[0].vendor || '',
        description: skillData[0].description || '',
        category: catObj ? catObj.name : 'Other',
        category_id: skillData[0].category_id
      };

      setSkills([...skills, newSkillMapped]);
      setNewSkillName('');
      setNewSkillVendor('');
      setNewSkillDescription('');
      showToast(`Successfully added skill: ${newSkillName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error adding skill: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Update a Skill
  const handleUpdateSkill = async (skillId) => {
    if (!editSkillName || !editSkillCategoryId) return;
    setLoading(true);

    const catId = parseInt(editSkillCategoryId);
    const catObj = categories.find(c => String(c.id) === String(catId));

    if (useDemoMode) {
      setSkills(skills.map(s => s.id === skillId ? { 
        ...s, 
        name: editSkillName, 
        vendor: editSkillVendor,
        description: editSkillDescription,
        category: catObj ? catObj.name : 'Other',
        category_id: catId
      } : s));
      setEditingSkillId(null);
      showToast(`Updated skill details (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('skills')
        .update({ 
          name: editSkillName, 
          category_id: catId,
          vendor: editSkillVendor || null,
          description: editSkillDescription || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.map(s => s.id === skillId ? { 
        ...s, 
        name: editSkillName, 
        vendor: editSkillVendor,
        description: editSkillDescription,
        category: catObj ? catObj.name : 'Other',
        category_id: catId
      } : s));
      setEditingSkillId(null);
      showToast(`Successfully updated skill: ${editSkillName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error updating skill: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Delete a Skill
  const handleDeleteSkill = async (skillId, name) => {
    if (!window.confirm(`Are you sure you want to remove skill "${name}"? This will delete all developer assessments for this skill.`)) return;
    setLoading(true);

    if (useDemoMode) {
      setSkills(skills.filter(s => s.id !== skillId));
      setDeveloperSkills(developerSkills.filter(ds => ds.skill_id !== skillId));
      showToast(`Removed skill ${name} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.filter(s => s.id !== skillId));
      setDeveloperSkills(developerSkills.filter(ds => ds.skill_id !== skillId));
      showToast(`Successfully removed skill: ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Error deleting skill: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Add a Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setLoading(true);

    if (useDemoMode) {
      const newCat = {
        id: Date.now(),
        name: newCategoryName,
        description: newCategoryDesc
      };
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      setNewCategoryDesc('');
      
      // Auto-navigate back and set value based on redirect target
      if (categoryRedirectTarget === 'skills') {
        setActiveTab('skills');
        setNewSkillCategoryId(String(newCat.id));
      }
      setCategoryRedirectTarget(null);
      
      showToast(`Added category: ${newCategoryName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategoryName, 
          description: newCategoryDesc || null 
        }])
        .select();

      if (error) throw error;

      const addedCatId = data[0].id;
      setCategories([...categories, data[0]]);
      setNewCategoryName('');
      setNewCategoryDesc('');
      
      // Auto-navigate back and set value based on redirect target
      if (categoryRedirectTarget === 'skills') {
        setActiveTab('skills');
        setNewSkillCategoryId(String(addedCatId));
      }
      setCategoryRedirectTarget(null);
      
      showToast(`Successfully added category: ${newCategoryName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error adding category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Update a Category
  const handleUpdateCategory = async (catId) => {
    if (!editCategoryName) return;
    setLoading(true);

    if (useDemoMode) {
      setCategories(categories.map(c => c.id === catId ? { 
        ...c, 
        name: editCategoryName, 
        description: editCategoryDesc 
      } : c));
      setSkills(skills.map(s => s.category_id === catId ? { ...s, category: editCategoryName } : s));
      setEditingCategoryId(null);
      showToast(`Updated category details (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          name: editCategoryName, 
          description: editCategoryDesc || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', catId);

      if (error) throw error;

      setCategories(categories.map(c => c.id === catId ? { 
        ...c, 
        name: editCategoryName, 
        description: editCategoryDesc 
      } : c));
      setSkills(skills.map(s => s.category_id === catId ? { ...s, category: editCategoryName } : s));
      setEditingCategoryId(null);
      showToast(`Successfully updated category: ${editCategoryName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error updating category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Delete a Category
  const handleDeleteCategory = async (catId, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? This will fail if there are active skills referencing it.`)) return;
    setLoading(true);

    if (useDemoMode) {
      setCategories(categories.filter(c => c.id !== catId));
      showToast(`Removed category ${name} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== catId));
      showToast(`Successfully removed category: ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Error deleting category: ${err.message} (Double check for referencing skills)`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Add a Team
  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    setLoading(true);

    if (useDemoMode) {
      const newTeam = {
        id: Date.now(),
        name: newTeamName,
        description: newTeamDesc
      };
      setTeams([...teams, newTeam]);
      setNewTeamName('');
      setNewTeamDesc('');
      
      // Auto-navigate back and set filter/value based on redirect target
      if (teamRedirectTarget === 'developers') {
        setActiveTab('developers');
        setNewDevTeamId(String(newTeam.id));
      } else {
        setActiveTab('matrix');
        setSelectedTeamNames([newTeam.name]);
        setSelectedDevIds([]);
      }
      setTeamRedirectTarget(null);
      
      showToast(`Added team: ${newTeamName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ 
          name: newTeamName, 
          description: newTeamDesc || null 
        }])
        .select();

      if (error) throw error;

      const addedTeamName = data[0].name;
      const addedTeamId = data[0].id;
      setTeams([...teams, data[0]]);
      setNewTeamName('');
      setNewTeamDesc('');
      
      // Auto-navigate back and set filter/value based on redirect target
      if (teamRedirectTarget === 'developers') {
        setActiveTab('developers');
        setNewDevTeamId(String(addedTeamId));
      } else {
        setActiveTab('matrix');
        setSelectedTeamNames([addedTeamName]);
        setSelectedDevIds([]);
      }
      setTeamRedirectTarget(null);
      
      showToast(`Successfully added team: ${newTeamName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error adding team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Update a Team
  const handleUpdateTeam = async (teamId) => {
    if (!editTeamName) return;
    setLoading(true);

    if (useDemoMode) {
      setTeams(teams.map(t => t.id === teamId ? { 
        ...t, 
        name: editTeamName, 
        description: editTeamDesc 
      } : t));
      setDevelopers(developers.map(d => d.teamId === teamId ? { ...d, team: editTeamName } : d));
      setEditingTeamId(null);
      showToast(`Updated team details (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({ 
          name: editTeamName, 
          description: editTeamDesc || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.map(t => t.id === teamId ? { 
        ...t, 
        name: editTeamName, 
        description: editTeamDesc 
      } : t));
      setDevelopers(developers.map(d => d.teamId === teamId ? { ...d, team: editTeamName } : d));
      setEditingTeamId(null);
      showToast(`Successfully updated team: ${editTeamName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error updating team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Delete a Team
  const handleDeleteTeam = async (teamId, name) => {
    if (!window.confirm(`Are you sure you want to delete team "${name}"? This will remove all members from the team.`)) return;
    setLoading(true);

    if (useDemoMode) {
      setTeams(teams.filter(t => t.id !== teamId));
      setDevelopers(developers.map(d => d.teamId === teamId ? { ...d, team: 'No Team', teamId: null } : d));
      setSelectedTeamNames(prev => prev.filter(n => n !== name));
      showToast(`Removed team ${name} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.filter(t => t.id !== teamId));
      setDevelopers(developers.map(d => d.teamId === teamId ? { ...d, team: 'No Team', teamId: null } : d));
      setSelectedTeamNames(prev => prev.filter(n => n !== name));
      showToast(`Successfully removed team: ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Error deleting team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Assign or Unassign a Skill to/from a Team
  const handleToggleTeamSkill = async (teamId, skillId) => {
    const isAssigned = teamSkills.some(ts => ts.team_id === teamId && ts.skill_id === skillId);
    const targetSkill = skills.find(s => s.id === skillId);
    const targetTeam = teams.find(t => t.id === teamId);
    const skillName = targetSkill ? targetSkill.name : 'Skill';
    const teamName = targetTeam ? targetTeam.name : 'Team';

    setLoading(true);

    if (useDemoMode) {
      if (isAssigned) {
        setTeamSkills(teamSkills.filter(ts => !(ts.team_id === teamId && ts.skill_id === skillId)));
        showToast(`Removed skill "${skillName}" from ${teamName} (Demo)`);
      } else {
        const newTS = { id: `ts-${Date.now()}`, team_id: teamId, skill_id: skillId };
        setTeamSkills([...teamSkills, newTS]);
        showToast(`Assigned skill "${skillName}" to ${teamName} (Demo)`);
      }
      setLoading(false);
      return;
    }

    try {
      if (isAssigned) {
        // Soft delete: update active row (is_current=true) setting is_required=false, is_current=false, valid_to=CURRENT_DATE
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { error } = await supabase
          .from('team_skills')
          .update({
            is_required: false,
            is_current: false,
            valid_to: todayDate
          })
          .eq('team_id', teamId)
          .eq('skill_id', skillId)
          .eq('is_current', true);

        if (error) {
          console.error('Failed to soft-delete team skill:', error);
          throw error;
        }

        // Update local React state to filter out unassigned skill
        setTeamSkills(teamSkills.filter(ts => !(ts.team_id === teamId && ts.skill_id === skillId)));
        showToast(`Removed skill "${skillName}" from ${teamName}`);
      } else {
        // Assign skill: insert new active row with valid_from as YYYY-MM-DD
        const todayDate = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('team_skills')
          .insert([{ 
            team_id: teamId, 
            skill_id: skillId,
            is_required: true,
            is_current: true,
            valid_from: todayDate
          }])
          .select();

        if (error) {
          console.error('Failed to insert active team skill:', error);
          throw error;
        }

        const insertedRow = data && data[0] ? data[0] : { team_id: teamId, skill_id: skillId, is_required: true, is_current: true };
        setTeamSkills([...teamSkills, insertedRow]);
        showToast(`Assigned skill "${skillName}" to ${teamName}`);
      }
    } catch (err) {
      console.error(err);
      showToast(`Error updating team skill: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Team Member Governance: Assign existing member or create & assign new member to team
  const handleAssignDeveloperToTeam = async (devId, newTeamId) => {
    if (!devId) return;
    setLoading(true);
    const dev = developers.find(d => d.id === devId);
    if (!dev) {
      setLoading(false);
      return;
    }
    const oldTeamId = dev.teamId;
    const targetTeam = teams.find(t => t.id === newTeamId);
    const teamName = targetTeam ? targetTeam.name : 'No Team';

    if (useDemoMode) {
      setDevelopers(developers.map(d => d.id === devId ? { ...d, team: teamName, teamId: newTeamId } : d));
      showToast(newTeamId ? `Assigned ${dev.name} to ${teamName}` : `Removed ${dev.name} from team`);
      setLoading(false);
      return;
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (oldTeamId && oldTeamId !== newTeamId) {
        await supabase
          .from('person_teams')
          .update({ is_current: false, valid_to: todayStr, updated_at: new Date().toISOString() })
          .eq('person_id', devId)
          .eq('team_id', oldTeamId)
          .eq('is_current', true);
      }
      if (newTeamId && oldTeamId !== newTeamId) {
        await supabase
          .from('person_teams')
          .insert([{ person_id: devId, team_id: newTeamId, is_current: true, valid_from: todayStr }]);
      }
      setDevelopers(developers.map(d => d.id === devId ? { ...d, team: teamName, teamId: newTeamId } : d));
      showToast(newTeamId ? `Assigned ${dev.name} to ${teamName}` : `Removed ${dev.name} from team`);
    } catch (err) {
      showToast(`Error assigning team member: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAssignMember = async (e, teamId) => {
    e.preventDefault();
    if (!inlineMemberName.trim()) return;
    setLoading(true);
    const targetTeam = teams.find(t => t.id === teamId);
    const teamName = targetTeam ? targetTeam.name : 'No Team';

    if (useDemoMode) {
      const newDev = {
        id: `dev-fly-${Date.now()}`,
        name: inlineMemberName.trim(),
        role: inlineMemberRole.trim() || 'Developer',
        email: inlineMemberEmail.trim() || `${inlineMemberName.trim().toLowerCase().replace(/\s+/g, '.')}@company.com`,
        team: teamName,
        teamId: teamId,
        companyLoginId: '',
        managerName: '',
        managerCompanyLoginId: ''
      };
      setDevelopers(prev => [...prev, newDev]);
      setInlineMemberName('');
      setInlineMemberRole('Developer');
      setInlineMemberEmail('');
      setShowInlineAddMemberTeamId(null);
      showToast(`Created & added ${newDev.name} to ${teamName}`);
      setLoading(false);
      return;
    }

    try {
      const { data: personData, error: personErr } = await supabase
        .from('person')
        .insert([{
          full_name: inlineMemberName.trim(),
          role_title: inlineMemberRole.trim() || 'Developer',
          email: inlineMemberEmail.trim() || null
        }])
        .select();

      if (personErr) throw personErr;
      const createdPerson = personData && personData[0] ? personData[0] : null;
      const newDevId = createdPerson ? createdPerson.id : `dev-${Date.now()}`;

      const todayStr = new Date().toISOString().split('T')[0];
      await supabase
        .from('person_teams')
        .insert([{
          person_id: newDevId,
          team_id: teamId,
          is_current: true,
          valid_from: todayStr
        }]);

      const newDev = {
        id: newDevId,
        name: inlineMemberName.trim(),
        role: inlineMemberRole.trim() || 'Developer',
        email: inlineMemberEmail.trim() || '',
        team: teamName,
        teamId: teamId,
        companyLoginId: '',
        managerName: '',
        managerCompanyLoginId: ''
      };

      setDevelopers(prev => [...prev, newDev]);
      setInlineMemberName('');
      setInlineMemberRole('Developer');
      setInlineMemberEmail('');
      setShowInlineAddMemberTeamId(null);
      showToast(`Successfully created & added ${newDev.name} to ${teamName}`);
    } catch (err) {
      showToast(`Error creating team member: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Create a new skill on the fly and auto-assign it to a team
  const handleCreateAndAssignSkill = async (e, teamId) => {
    e.preventDefault();
    if (!inlineSkillName || !inlineSkillName.trim()) return;

    const targetTeam = teams.find(t => t.id === teamId);
    const teamName = targetTeam ? targetTeam.name : 'Team';
    const catId = inlineSkillCategoryId || (categories[0] ? categories[0].id : null);
    const catObj = categories.find(c => String(c.id) === String(catId));
    const catName = catObj ? catObj.name : 'Uncategorized';

    setLoading(true);

    if (useDemoMode) {
      const newSkillId = `skill-fly-${Date.now()}`;
      const newSkill = {
        id: newSkillId,
        name: inlineSkillName.trim(),
        category: catName,
        category_id: catId,
        vendor: inlineSkillVendor.trim() || null,
        description: inlineSkillDescription.trim() || null
      };

      setSkills(prev => [...prev, newSkill]);

      const newTS = { id: `ts-fly-${Date.now()}`, team_id: teamId, skill_id: newSkillId, is_required: true, is_current: true };
      setTeamSkills(prev => [...prev, newTS]);

      setInlineSkillName('');
      setInlineSkillVendor('');
      setInlineSkillDescription('');
      setInlineSkillCategoryId('');
      setShowInlineAddSkillTeamId(null);

      showToast(`Created skill "${newSkill.name}" and assigned to ${teamName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      // 1. Insert new skill in skills table
      const { data: skillData, error: skillError } = await supabase
        .from('skills')
        .insert([{
          name: inlineSkillName.trim(),
          category_id: catId,
          vendor: inlineSkillVendor.trim() || null,
          description: inlineSkillDescription.trim() || null
        }])
        .select();

      if (skillError) throw skillError;

      const createdSkill = skillData[0];
      const newSkillMapped = {
        ...createdSkill,
        category: catName
      };

      setSkills(prev => [...prev, newSkillMapped]);

      // 2. Assign newly created skill to team in team_skills table
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: tsData, error: tsError } = await supabase
        .from('team_skills')
        .insert([{
          team_id: teamId,
          skill_id: createdSkill.id,
          is_required: true,
          is_current: true,
          valid_from: todayDate
        }])
        .select();

      if (tsError) throw tsError;

      const insertedTS = tsData && tsData[0] ? tsData[0] : { team_id: teamId, skill_id: createdSkill.id, is_required: true, is_current: true };
      setTeamSkills(prev => [...prev, insertedTS]);

      setInlineSkillName('');
      setInlineSkillVendor('');
      setInlineSkillDescription('');
      setInlineSkillCategoryId('');
      setShowInlineAddSkillTeamId(null);

      showToast(`Successfully created "${newSkillMapped.name}" and assigned to ${teamName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error creating skill on the fly: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Set Skill Level directly for a Developer
  const handleSetSkillLevel = async (devId, skillId, targetLevel) => {
    const levels = ['None', 'Basic', 'Emerging', 'Competent', 'Strong', 'Expert'];
    
    // Find current level
    const currentRecord = developerSkills.find(
      (ds) => ds.developer_id === devId && ds.skill_id === skillId
    );
    const currentLevel = currentRecord ? currentRecord.level : 'None';
    
    // If target is same as current, do nothing
    if (targetLevel === currentLevel) return;

    setLoading(true);

    if (useDemoMode) {
      let updatedSkills;
      if (targetLevel === 'None') {
        updatedSkills = developerSkills.filter(
          (ds) => !(ds.developer_id === devId && ds.skill_id === skillId)
        );
      } else {
        const index = developerSkills.findIndex(
          (ds) => ds.developer_id === devId && ds.skill_id === skillId
        );
        if (index > -1) {
          updatedSkills = [...developerSkills];
          updatedSkills[index] = { ...updatedSkills[index], level: targetLevel };
        } else {
          updatedSkills = [...developerSkills, { developer_id: devId, skill_id: skillId, level: targetLevel }];
        }
      }
      setDeveloperSkills(updatedSkills);
      showToast(`Updated to ${targetLevel} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const targetLevelIdx = levels.indexOf(targetLevel);
      const todayStr = new Date().toISOString().split('T')[0];

      if (targetLevel === 'None') {
        // Close current active record in person_skill_assessments
        const { error } = await supabase
          .from('person_skill_assessments')
          .update({
            is_current: false,
            valid_to: todayStr,
            updated_at: new Date().toISOString()
          })
          .match({ person_id: devId, skill_id: skillId, is_current: true });

        if (error) throw error;

        setDeveloperSkills(
          developerSkills.filter((ds) => !(ds.developer_id === devId && ds.skill_id === skillId))
        );
      } else {
        // Determine whether to INSERT or UPDATE based on current record existence
        const exists = currentRecord !== undefined;

        if (exists) {
          // Temporal Update:
          // 1. Close current active record
          const { error: closeErr } = await supabase
            .from('person_skill_assessments')
            .update({ 
              is_current: false,
              valid_to: todayStr,
              updated_at: new Date().toISOString()
            })
            .match({ person_id: devId, skill_id: skillId, is_current: true });

          if (closeErr) throw closeErr;

          // 2. Insert new active record
          const { error: insertErr } = await supabase
            .from('person_skill_assessments')
            .insert([{ 
              person_id: devId, 
              skill_id: skillId, 
              competency_level_id: targetLevelIdx,
              is_current: true,
              valid_from: todayStr,
              assessed_on: todayStr
            }]);

          if (insertErr) throw insertErr;
        } else {
          // Insert new active record
          const { error: insertErr } = await supabase
            .from('person_skill_assessments')
            .insert([{ 
              person_id: devId, 
              skill_id: skillId, 
              competency_level_id: targetLevelIdx,
              is_current: true,
              valid_from: todayStr,
              assessed_on: todayStr
            }]);

          if (insertErr) throw insertErr;
        }

        // Fetch all assessments again and update client cache
        const { data: junctionData, error: fetchErr } = await supabase
          .from('person_skill_assessments')
          .select('*')
          .eq('is_current', true);
        
        if (fetchErr) throw fetchErr;
        
        const mappedJunction = (junctionData || []).map(row => ({
          developer_id: row.person_id,
          skill_id: row.skill_id,
          level: levels[row.competency_level_id] || 'None'
        }));
        setDeveloperSkills(mappedJunction);
      }
      showToast(`Updated skill level to ${targetLevel}`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to update proficiency: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const fetchSkillTimeline = async (personId, skillId, personName, skillName) => {
    setLoading(true);
    setTimelineContext({ personName, skillName });
    
    if (useDemoMode) {
      // Generate some mock history for demo mode
      const now = new Date();
      const mockData = [
        { date: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0], level: 1 },
        { date: new Date(now.getFullYear(), now.getMonth() - 6, 15).toISOString().split('T')[0], level: 2 },
        { date: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString().split('T')[0], level: 3 },
        { date: new Date().toISOString().split('T')[0], level: 4 }
      ];
      setTimelineData(mockData);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('person_skill_assessments')
        .select('valid_from, competency_level_id')
        .eq('person_id', personId)
        .eq('skill_id', skillId)
        .order('valid_from', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTimelineData(data.map(d => ({ date: d.valid_from, level: d.competency_level_id })));
      } else {
        setTimelineData([]);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      showToast('Error loading timeline history');
    } finally {
      setLoading(false);
    }
  };

  // Helper to retrieve the current proficiency level star rating
  const getProficiencyBadge = (devId, skillId) => {
    const record = developerSkills.find(
      (ds) => ds.developer_id === devId && ds.skill_id === skillId
    );
    
    const level = record ? record.level : 'None';
    const person = developers.find(d => d.id === devId);
    const skill = skills.find(s => s.id === skillId);
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <StarRating
          value={level}
          onChange={(targetLevel) => handleSetSkillLevel(devId, skillId, targetLevel)}
          disabled={loading}
        />
        <button 
          type="button" 
          onClick={() => fetchSkillTimeline(devId, skillId, person?.name || 'Unknown', skill?.name || 'Unknown')}
          title="View Timeline History"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '2px', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s ease, color 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Activity size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <CheckCircle size={18} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Section */}
      <header className="header">
        <div className="logo-section">
          <Activity size={32} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))' }} />
          <h1>SkillsMatrix</h1>
          <span 
            className="version-tag" 
            style={{ 
              background: 'rgba(139, 92, 246, 0.18)', 
              border: '1px solid rgba(139, 92, 246, 0.4)', 
              color: '#c4b5fd', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              padding: '0.15rem 0.5rem', 
              borderRadius: '12px',
              letterSpacing: '0.04em',
              marginLeft: '0.2rem'
            }}
            title={`Application Version ${APP_VERSION}`}
          >
            {APP_VERSION}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Toggles Demo Mode */}
          {connectionStatus === 'error' && (
            <button 
              className="btn-secondary" 
              onClick={() => checkConnectionAndLoad(false)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'loading-spinner' : ''} />
              Retry Connection
            </button>
          )}

          {connectionStatus === 'connected' ? (
            <div className="db-badge connected">
              <Database size={16} />
              <span>Connected to Supabase</span>
            </div>
          ) : connectionStatus === 'partial' ? (
            <div className="db-badge connected" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
              <Settings size={16} />
              <span>Preview/Demo Mode</span>
            </div>
          ) : (
            <div className="db-badge disconnected">
              <AlertCircle size={16} />
              <span>Supabase Connection Issues</span>
            </div>
          )}
        </div>
      </header>

      {/* Database Schema Setup Guide Banner */}
      {connectionStatus === 'error' && (
        <div className="setup-box glass-panel" style={{ marginBottom: '2.5rem' }}>
          <h4>
            <Database size={20} />
            Supabase Connection & Database Setup Required
          </h4>
          <p>
            Your application was successfully configured with your credentials in <code>.env</code>, but we encountered an error querying tables.
            This usually happens because the tables do not exist in your Supabase database. You can initialize them in 30 seconds:
          </p>
          <ol style={{ marginLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            <li>Open your <strong><a href={`https://supabase.com/dashboard/project/fnsifhhpcrqdzwguhzvq/sql/new`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Supabase Dashboard for fnsifhhpcrqdzwguhzvq</a></strong>.</li>
            <li>Go to the <strong>SQL Editor</strong> in the left sidebar and click <strong>New Query</strong>.</li>
            <li>Copy the SQL code block below, paste it into the editor, and click <strong>Run</strong>.</li>
            <li>Click "Refresh Status" below once the script completes.</li>
          </ol>
          
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              onClick={handleCopySql} 
              style={{ position: 'absolute', right: '1rem', top: '1rem', width: 'auto', padding: '0.5rem' }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
            <pre className="code-block">{SQL_SETUP_SCRIPT}</pre>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => checkConnectionAndLoad(false)}>
              <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} />
              Refresh Database Connection Status
            </button>
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => checkConnectionAndLoad(true)}>
              Preview Dashboard using Mock Data
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Sidebar Controls */}
        

        {/* Content Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, width: '100%', maxWidth: '100%' }}>
          {/* Tab Selection */}
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              <LayoutGrid size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Skills Matrix Grid
            </button>
            <button 
              className={`tab-btn ${activeTab === 'developers' ? 'active' : ''}`}
              onClick={() => setActiveTab('developers')}
            >
              <Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Team Members ({developers.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <BookOpen size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Tracked Skills ({skills.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <LayoutGrid size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Categories ({categories.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Briefcase size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Teams ({teams.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <BookOpen size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              User Guide & Docs
            </button>
          </div>

          {/* Tab 1: Skills Matrix Grid */}
          {activeTab === 'matrix' && (
            <div className="glass-panel" style={{ padding: '1.5rem', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Team Competency Matrix</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Interactive grid view mapping team skills. Click on the stars to set the proficiency level (1 to 5 stars), or click the active rating again / click the "x" button to reset it to 0 stars (None). Hover over stars to see descriptions.
              </p>

              {developers.length === 0 || skills.length === 0 ? (
                <div className="empty-state">
                  <LayoutGrid size={48} />
                  <p>No team members or skills tracked yet. Use the sidebar on the left to add skills and members.</p>
                </div>
              ) : (
                <>
                  {/* Filters Bar */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'flex-end'
                  }}>
                    {/* 1. Filter by Team (Multi-select) */}
                    <div style={{ flex: '1', minWidth: '220px', position: 'relative', zIndex: isTeamDropdownOpen ? 500 : 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Team ({selectedTeamNames.length === 0 ? 'All' : `${selectedTeamNames.length} selected`})
                      </label>
                      <button
                        ref={teamBtnRef}
                        type="button"
                        className="form-select"
                        onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                        style={{
                          height: '42px',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderColor: isTeamDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedTeamNames.length === 0
                            ? 'All Teams'
                            : selectedTeamNames.length === 1
                            ? selectedTeamNames[0]
                            : `${selectedTeamNames.length} Teams Selected`}
                        </span>
                        <ChevronRight 
                          size={16} 
                          style={{ 
                            transform: isTeamDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-muted)'
                          }} 
                        />
                      </button>

                      {isTeamDropdownOpen && createPortal(
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                            onClick={() => setIsTeamDropdownOpen(false)} 
                          />
                          <div
                            className="filter-dropdown-panel"
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#0f172a',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                              maxHeight: '280px',
                              overflowY: 'auto',
                              padding: '0.5rem',
                              ...getPortalDropdownStyle(teamBtnRef)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsTeamDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedTeamNames.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedTeamNames.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTeamNames.length === 0}
                                onChange={() => setSelectedTeamNames([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedTeamNames.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                            {['No Team', ...teams.map(t => t.name)].map((tName) => {
                              const isChecked = selectedTeamNames.length === 0 || selectedTeamNames.includes(tName);
                              return (
                                <label
                                  key={tName}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.45rem 0.5rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: isChecked ? '#fff' : 'var(--text-secondary)',
                                    background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const allTeamNames = ['No Team', ...teams.map(t => t.name)];
                                      if (selectedTeamNames.length === 0) {
                                        setSelectedTeamNames([tName]);
                                      } else if (selectedTeamNames.includes(tName)) {
                                        const next = selectedTeamNames.filter(n => n !== tName);
                                        setSelectedTeamNames(next.length === 0 ? [] : next);
                                      } else {
                                        const next = [...selectedTeamNames, tName];
                                        setSelectedTeamNames(next.length === allTeamNames.length ? [] : next);
                                      }
                                    }}
                                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontWeight: isChecked ? 600 : 400 }}>{tName}</span>
                                </label>
                              );
                            })}

                            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem 0.5rem', width: '100%', textAlign: 'left', fontWeight: 500 }}
                                onClick={() => {
                                  setIsTeamDropdownOpen(false);
                                  setTeamRedirectTarget('matrix');
                                  setActiveTab('teams');
                                }}
                              >
                                + Add New Team...
                              </button>
                            </div>
                          </div>
                        </>,
                        document.body
                      )}
                    </div>

                    {/* 2. Filter by Team Member (Multi-select) */}
                    <div style={{ flex: '1', minWidth: '220px', position: 'relative', zIndex: isDevDropdownOpen ? 500 : 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Team Member ({selectedDevIds.length === 0 ? 'All' : `${selectedDevIds.length} selected`})
                      </label>
                      <button
                        ref={devBtnRef}
                        type="button"
                        className="form-select"
                        onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
                        style={{
                          height: '42px',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderColor: isDevDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedDevIds.length === 0
                            ? 'All Members'
                            : selectedDevIds.length === 1
                            ? developers.find(d => String(d.id) === String(selectedDevIds[0]))?.name || '1 Member'
                            : `${selectedDevIds.length} Members Selected`}
                        </span>
                        <ChevronRight 
                          size={16} 
                          style={{ 
                            transform: isDevDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-muted)'
                          }} 
                        />
                      </button>

                      {isDevDropdownOpen && createPortal(
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                            onClick={() => setIsDevDropdownOpen(false)} 
                          />
                          <div
                            className="filter-dropdown-panel"
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#0f172a',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                              maxHeight: '280px',
                              overflowY: 'auto',
                              padding: '0.5rem',
                              ...getPortalDropdownStyle(devBtnRef)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsDevDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedDevIds.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedDevIds.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDevIds.length === 0}
                                onChange={() => setSelectedDevIds([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedDevIds.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                            {(() => {
                              const availDevs = developers
                                .filter(dev => selectedTeamNames.length === 0 || selectedTeamNames.includes(dev.team))
                                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                              return (
                                <>
                                  {availDevs.map((dev) => {
                                    const devIdStr = String(dev.id);
                                    const isChecked = selectedDevIds.length === 0 || selectedDevIds.includes(devIdStr);
                                    return (
                                      <label
                                        key={dev.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.45rem 0.5rem',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '0.85rem',
                                          color: isChecked ? '#fff' : 'var(--text-secondary)',
                                          background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                          transition: 'background 0.15s ease'
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            if (selectedDevIds.length === 0) {
                                              setSelectedDevIds([devIdStr]);
                                            } else if (selectedDevIds.includes(devIdStr)) {
                                              const next = selectedDevIds.filter(id => id !== devIdStr);
                                              setSelectedDevIds(next.length === 0 ? [] : next);
                                            } else {
                                              const next = [...selectedDevIds, devIdStr];
                                              setSelectedDevIds(next.length === availDevs.length ? [] : next);
                                            }
                                          }}
                                          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontWeight: isChecked ? 600 : 400 }}>{dev.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                          {dev.team}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </>
                              );
                            })()}

                            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem 0.5rem', width: '100%', textAlign: 'left', fontWeight: 500 }}
                                onClick={() => {
                                  setIsDevDropdownOpen(false);
                                  setActiveTab('developers');
                                }}
                              >
                                + Add New Member...
                              </button>
                            </div>
                          </div>
                        </>,
                        document.body
                      )}
                    </div>

                    {/* 3. Filter by Skill (Multi-select) */}
                    <div style={{ flex: '1', minWidth: '220px', position: 'relative', zIndex: isSkillDropdownOpen ? 500 : 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Skill ({selectedSkillIds.length === 0 ? 'All' : `${selectedSkillIds.length} selected`})
                      </label>
                      <button
                        ref={skillBtnRef}
                        type="button"
                        className="form-select"
                        onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                        style={{
                          height: '42px',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderColor: isSkillDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedSkillIds.length === 0
                            ? 'All Skills'
                            : selectedSkillIds.length === 1
                            ? skills.find(s => String(s.id) === String(selectedSkillIds[0]))?.name || '1 Skill'
                            : `${selectedSkillIds.length} Skills Selected`}
                        </span>
                        <ChevronRight 
                          size={16} 
                          style={{ 
                            transform: isSkillDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-muted)'
                          }} 
                        />
                      </button>

                      {isSkillDropdownOpen && createPortal(
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                            onClick={() => setIsSkillDropdownOpen(false)} 
                          />
                          <div
                            className="filter-dropdown-panel"
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#0f172a',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                              maxHeight: '280px',
                              overflowY: 'auto',
                              padding: '0.5rem',
                              ...getPortalDropdownStyle(skillBtnRef)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsSkillDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedSkillIds.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedSkillIds.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSkillIds.length === 0}
                                onChange={() => setSelectedSkillIds([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedSkillIds.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                            {skills
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((sk) => {
                                const skIdStr = String(sk.id);
                                const isChecked = selectedSkillIds.length === 0 || selectedSkillIds.includes(skIdStr);
                                return (
                                  <label
                                    key={sk.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.45rem 0.5rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      color: isChecked ? '#fff' : 'var(--text-secondary)',
                                      background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                      transition: 'background 0.15s ease'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (selectedSkillIds.length === 0) {
                                          setSelectedSkillIds([skIdStr]);
                                        } else if (selectedSkillIds.includes(skIdStr)) {
                                          const next = selectedSkillIds.filter(id => id !== skIdStr);
                                          setSelectedSkillIds(next.length === 0 ? [] : next);
                                        } else {
                                          const next = [...selectedSkillIds, skIdStr];
                                          setSelectedSkillIds(next.length === skills.length ? [] : next);
                                        }
                                      }}
                                      style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{sk.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                      {sk.category}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>

                    {/* 4. Filter by Competency Level (Multi-select) */}
                    <div style={{ flex: '1', minWidth: '220px', position: 'relative', zIndex: isLevelDropdownOpen ? 500 : 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Competency Level ({selectedLevelFilters.length === 0 || selectedLevelFilters.length === 6 ? 'All' : `${selectedLevelFilters.length} selected`})
                      </label>
                      <button
                        ref={levelBtnRef}
                        type="button"
                        className="form-select"
                        onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                        style={{
                          height: '42px',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderColor: isLevelDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedLevelFilters.length === 0 || selectedLevelFilters.length === 6
                            ? 'All Levels'
                            : selectedLevelFilters.length === 1
                            ? [
                                { level: 0, label: '0 – None' },
                                { level: 1, label: '1 – Basic' },
                                { level: 2, label: '2 – Emerging' },
                                { level: 3, label: '3 – Competent' },
                                { level: 4, label: '4 – Strong' },
                                { level: 5, label: '5 – Expert' }
                              ].find(o => o.level === selectedLevelFilters[0])?.label || '1 Level'
                            : `${selectedLevelFilters.length} Levels Selected`}
                        </span>
                        <ChevronRight 
                          size={16} 
                          style={{ 
                            transform: isLevelDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-muted)'
                          }} 
                        />
                      </button>

                      {isLevelDropdownOpen && createPortal(
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                            onClick={() => setIsLevelDropdownOpen(false)} 
                          />
                          <div
                            className="filter-dropdown-panel"
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#0f172a',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                              maxHeight: '280px',
                              overflowY: 'auto',
                              padding: '0.5rem',
                              ...getPortalDropdownStyle(levelBtnRef)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsLevelDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedLevelFilters.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedLevelFilters.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedLevelFilters.length === 0}
                                onChange={() => setSelectedLevelFilters([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedLevelFilters.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                            {[
                              { level: 0, label: '0 – None', desc: '0 Stars', color: 'var(--text-muted)' },
                              { level: 1, label: '1 – Basic', desc: '1 Star', color: 'var(--color-basic)' },
                              { level: 2, label: '2 – Emerging', desc: '2 Stars', color: 'var(--color-emerging)' },
                              { level: 3, label: '3 – Competent', desc: '3 Stars', color: 'var(--color-competent)' },
                              { level: 4, label: '4 – Strong', desc: '4 Stars', color: 'var(--color-strong)' },
                              { level: 5, label: '5 – Expert', desc: '5 Stars', color: 'var(--color-expert)' }
                            ].map((lvlObj) => {
                              const isChecked = selectedLevelFilters.length === 0 || selectedLevelFilters.includes(lvlObj.level);
                              return (
                                <label
                                  key={lvlObj.level}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.45rem 0.5rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: isChecked ? '#fff' : 'var(--text-secondary)',
                                    background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (selectedLevelFilters.length === 0) {
                                        setSelectedLevelFilters([lvlObj.level]);
                                      } else if (selectedLevelFilters.includes(lvlObj.level)) {
                                        const next = selectedLevelFilters.filter(l => l !== lvlObj.level);
                                        setSelectedLevelFilters(next.length === 0 ? [] : next);
                                      } else {
                                        const next = [...selectedLevelFilters, lvlObj.level];
                                        setSelectedLevelFilters(next.length === 6 ? [] : next);
                                      }
                                    }}
                                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{lvlObj.label}</span>
                                    <span style={{ fontSize: '0.75rem', color: lvlObj.color, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      {lvlObj.level > 0 ? (
                                        <>
                                          <Star size={12} fill={lvlObj.color} color={lvlObj.color} />
                                          <span>{lvlObj.level}</span>
                                        </>
                                      ) : (
                                        <span>None</span>
                                      )}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                    
                    {(selectedTeamNames.length > 0 || selectedDevIds.length > 0 || selectedSkillIds.length > 0 || (selectedLevelFilters.length > 0 && selectedLevelFilters.length < 6)) && (
                      <div style={{ display: 'flex' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', margin: 0 }}
                          onClick={() => {
                            setSelectedTeamNames([]);
                            setSelectedDevIds([]);
                            setSelectedSkillIds([]);
                            setSelectedLevelFilters([]);
                          }}
                        >
                          <X size={16} />
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Swipe Hint for Mobile/Tablet */}
                  <div className="swipe-hint-banner">
                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                    <span>Swipe horizontally to view all skills</span>
                    <ChevronRight size={14} />
                  </div>

                  <div className="matrix-container">
                    <table className="matrix-table">
                      {(() => {
                        // Determine skills to show in columns based on selected team filter & selected skill checkboxes
                        let displayedSkills = skills;

                        if (selectedTeamNames.length > 0) {
                          const matchedTeams = teams.filter(t => selectedTeamNames.includes(t.name));
                          const matchedTeamIds = matchedTeams.map(t => t.id);
                          const teamAssignedSkillIds = teamSkills
                            .filter(ts => matchedTeamIds.includes(ts.team_id) && ts.is_current !== false && ts.is_required !== false)
                            .map(ts => ts.skill_id);

                          displayedSkills = skills.filter(s => teamAssignedSkillIds.includes(s.id));
                        }

                        if (selectedSkillIds.length > 0) {
                          displayedSkills = displayedSkills.filter(s => selectedSkillIds.includes(String(s.id)));
                        }

                        const levelsList = ['None', 'Basic', 'Emerging', 'Competent', 'Strong', 'Expert'];

                        const filteredDevs = [...developers]
                          .filter((dev) => {
                            const matchesTeam = selectedTeamNames.length === 0 || selectedTeamNames.includes(dev.team);
                            const matchesDev = selectedDevIds.length === 0 || selectedDevIds.includes(String(dev.id));

                            let matchesLevel = true;
                            if (selectedLevelFilters.length > 0 && selectedLevelFilters.length < 6) {
                              if (displayedSkills.length === 0) {
                                matchesLevel = false;
                              } else {
                                matchesLevel = displayedSkills.some((skill) => {
                                  const record = developerSkills.find(ds => ds.developer_id === dev.id && ds.skill_id === skill.id);
                                  const devLevelName = record ? record.level : 'None';
                                  const devLevelNum = levelsList.indexOf(devLevelName);
                                  return selectedLevelFilters.includes(devLevelNum);
                                });
                              }
                            }

                            return matchesTeam && matchesDev && matchesLevel;
                          })
                          .sort((a, b) => {
                            const nameA = (a.name || '').toLowerCase();
                            const nameB = (b.name || '').toLowerCase();
                            return matrixSortOrder === 'asc'
                              ? nameA.localeCompare(nameB)
                              : nameB.localeCompare(nameA);
                          });

                        return (
                          <>
                            <thead>
                              <tr>
                                <th 
                                  onClick={() => setMatrixSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                                  style={{ cursor: 'pointer', userSelect: 'none', ...getColStyle('matrix-dev-col', 220) }}
                                  className="sortable-header"
                                  title={`Sort by Team Member Name ${matrixSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>Team Member</span>
                                    {matrixSortOrder === 'asc' ? (
                                      <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
                                    ) : (
                                      <ArrowDown size={14} style={{ color: 'var(--accent-primary)' }} />
                                    )}
                                  </div>
                                  <ColumnResizer colKey="matrix-dev-col" defaultWidth={220} minWidth={140} />
                                </th>
                                {displayedSkills.length === 0 ? (
                                  <th style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--text-muted)' }}>
                                    No skills assigned to team
                                  </th>
                                ) : (
                                  displayedSkills.map((skill) => (
                                    <th key={skill.id} title={`${skill.name} (${skill.category})`} style={getColStyle(`matrix-skill-${skill.id}`, 180)}>
                                      {skill.name}
                                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, opacity: 0.6 }}>{skill.category}</span>
                                      <ColumnResizer colKey={`matrix-skill-${skill.id}`} defaultWidth={180} minWidth={140} />
                                    </th>
                                  ))
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDevs.length === 0 ? (
                                <tr>
                                  <td colSpan={Math.max(displayedSkills.length, 1) + 1} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                                      <Users size={32} style={{ opacity: 0.5, color: 'var(--accent-primary)' }} />
                                      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>No team members match the selected filters.</span>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}
                                        onClick={() => {
                                          setSelectedTeamNames([]);
                                          setSelectedDevIds([]);
                                          setSelectedSkillIds([]);
                                          setSelectedLevelFilters([]);
                                        }}
                                      >
                                        Clear Filters
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : displayedSkills.length === 0 ? (
                                <tr>
                                  <td colSpan={2} style={{ textAlign: 'center', padding: '2rem 1.5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                      <BookOpen size={28} style={{ opacity: 0.5, color: 'var(--accent-primary)' }} />
                                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>No skills assigned to selected teams.</span>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ width: 'auto', padding: '0.35rem 0.85rem', marginTop: '0.25rem', fontSize: '0.8rem' }}
                                        onClick={() => setActiveTab('teams')}
                                      >
                                        Manage Team Skills
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredDevs.map((dev) => (
                                  <tr key={dev.id}>
                                    <td style={getColStyle('matrix-dev-col', 220)}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                                        <span className="dev-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {dev.name}
                                        </span>
                                        <button 
                                          className="info-btn"
                                          onClick={() => setSelectedDevInfo(dev)}
                                          title="View details"
                                        >
                                          <Info size={13} />
                                        </button>
                                      </div>
                                    </td>
                                    {displayedSkills.map((skill) => (
                                      <td key={skill.id} style={getColStyle(`matrix-skill-${skill.id}`, 180)}>
                                        {getProficiencyBadge(dev.id, skill.id)}
                                      </td>
                                    ))}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </>
                        );
                      })()}
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Team Members List */}
          {activeTab === 'developers' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Team Members List</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleExportDevelopers} 
                    style={{ height: '38px', padding: '0 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
                    title="Export team members list to CSV file"
                  >
                    <Download size={15} />
                    Export CSV
                  </button>
                  <label 
                    className="btn-secondary" 
                    style={{ height: '38px', padding: '0 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'auto', cursor: 'pointer', margin: 0 }}
                    title="Import team members list from CSV file"
                  >
                    <Upload size={15} />
                    Import CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleImportDevelopers} 
                      style={{ display: 'none' }} 
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
              
              {/* Add Team Member Form */}
              <form onSubmit={handleAddDeveloper} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Developer Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Ellen Ripley" 
                    value={newDevName}
                    onChange={(e) => setNewDevName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Role</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Devops Architect" 
                    value={newDevRole}
                    onChange={(e) => setNewDevRole(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. ellen@company.com (Optional)" 
                    value={newDevEmail}
                    onChange={(e) => setNewDevEmail(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Company Login ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. jdoe (Optional)" 
                    value={newDevCompanyLoginId}
                    onChange={(e) => setNewDevCompanyLoginId(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Manager Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. John Miller (Optional)" 
                    value={newDevManagerName}
                    onChange={(e) => setNewDevManagerName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Manager Company Login ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. jmiller (Optional)" 
                    value={newDevManagerCompanyLoginId}
                    onChange={(e) => setNewDevManagerCompanyLoginId(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Assign to Team</label>
                  <select 
                    className="form-input" 
                    style={{ height: '42px' }}
                    value={newDevTeamId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_TEAM') {
                        setTeamRedirectTarget('developers');
                        setActiveTab('teams');
                        setNewDevTeamId('');
                      } else {
                        setNewDevTeamId(e.target.value);
                      }
                    }}
                  >
                    <option value="">No Team</option>
                    {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                    <option disabled>— Actions —</option>
                    <option value="ADD_TEAM">+ Add New Team...</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ height: '42px' }} disabled={loading}>
                  <Plus size={16} />
                  Add Member
                </button>
              </form>
              
              {/* Team & Role Filters Toolbar */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                alignItems: 'flex-end'
              }}>
                {/* 1. Filter by Team */}
                <div style={{ flex: '1', minWidth: '200px', position: 'relative', zIndex: isDevListTeamDropdownOpen ? 500 : 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Filter by Team ({selectedDevListTeamNames.length === 0 ? 'All' : `${selectedDevListTeamNames.length} selected`})
                  </label>
                  <button
                    ref={devListTeamBtnRef}
                    type="button"
                    className="form-select"
                    onClick={() => setIsDevListTeamDropdownOpen(!isDevListTeamDropdownOpen)}
                    style={{
                      height: '38px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderColor: isDevListTeamDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedDevListTeamNames.length === 0
                        ? 'All Teams'
                        : selectedDevListTeamNames.length === 1
                        ? selectedDevListTeamNames[0]
                        : `${selectedDevListTeamNames.length} Teams Selected`}
                    </span>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        transform: isDevListTeamDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted)'
                      }} 
                    />
                  </button>

                  {isDevListTeamDropdownOpen && createPortal(
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                        onClick={() => setIsDevListTeamDropdownOpen(false)} 
                      />
                      <div
                        className="filter-dropdown-panel"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: '#0f172a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          padding: '0.5rem',
                          ...getPortalDropdownStyle(devListTeamBtnRef)
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsDevListTeamDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedDevListTeamNames.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedDevListTeamNames.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDevListTeamNames.length === 0}
                                onChange={() => setSelectedDevListTeamNames([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedDevListTeamNames.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                        {['No Team', ...teams.map(t => t.name)].map((tName) => {
                          const isChecked = selectedDevListTeamNames.length === 0 || selectedDevListTeamNames.includes(tName);
                          return (
                            <label
                              key={tName}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: isChecked ? '#fff' : 'var(--text-secondary)',
                                background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const allNames = ['No Team', ...teams.map(t => t.name)];
                                  if (selectedDevListTeamNames.length === 0) {
                                    setSelectedDevListTeamNames([tName]);
                                  } else if (selectedDevListTeamNames.includes(tName)) {
                                    const next = selectedDevListTeamNames.filter(n => n !== tName);
                                    setSelectedDevListTeamNames(next.length === 0 ? [] : next);
                                  } else {
                                    const next = [...selectedDevListTeamNames, tName];
                                    setSelectedDevListTeamNames(next.length === allNames.length ? [] : next);
                                  }
                                }}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: isChecked ? 600 : 400 }}>{tName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>,
                    document.body
                  )}
                </div>

                {/* 2. Filter by Role */}
                <div style={{ flex: '1', minWidth: '200px', position: 'relative', zIndex: isDevListRoleDropdownOpen ? 500 : 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Filter by Role ({selectedDevListRoleNames.length === 0 ? 'All' : `${selectedDevListRoleNames.length} selected`})
                  </label>
                  <button
                    ref={devListRoleBtnRef}
                    type="button"
                    className="form-select"
                    onClick={() => setIsDevListRoleDropdownOpen(!isDevListRoleDropdownOpen)}
                    style={{
                      height: '38px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderColor: isDevListRoleDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedDevListRoleNames.length === 0
                        ? 'All Roles'
                        : selectedDevListRoleNames.length === 1
                        ? selectedDevListRoleNames[0]
                        : `${selectedDevListRoleNames.length} Roles Selected`}
                    </span>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        transform: isDevListRoleDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted)'
                      }} 
                    />
                  </button>

                  {isDevListRoleDropdownOpen && createPortal(
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                        onClick={() => setIsDevListRoleDropdownOpen(false)} 
                      />
                      <div
                        className="filter-dropdown-panel"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: '#0f172a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          padding: '0.5rem',
                          ...getPortalDropdownStyle(devListRoleBtnRef)
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsDevListRoleDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedDevListRoleNames.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedDevListRoleNames.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDevListRoleNames.length === 0}
                                onChange={() => setSelectedDevListRoleNames([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedDevListRoleNames.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                        {(() => {
                          const allRoles = Array.from(new Set(developers.map(d => d.role).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                          return allRoles.map((r) => {
                            const isChecked = selectedDevListRoleNames.length === 0 || selectedDevListRoleNames.includes(r);
                            return (
                              <label
                                key={r}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.45rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  color: isChecked ? '#fff' : 'var(--text-secondary)',
                                  background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (selectedDevListRoleNames.length === 0) {
                                      setSelectedDevListRoleNames([r]);
                                    } else if (selectedDevListRoleNames.includes(r)) {
                                      const next = selectedDevListRoleNames.filter(name => name !== r);
                                      setSelectedDevListRoleNames(next.length === 0 ? [] : next);
                                    } else {
                                      const next = [...selectedDevListRoleNames, r];
                                      setSelectedDevListRoleNames(next.length === allRoles.length ? [] : next);
                                    }
                                  }}
                                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: isChecked ? 600 : 400 }}>{r}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </>,
                    document.body
                  )}
                </div>

                {(selectedDevListTeamNames.length > 0 || selectedDevListRoleNames.length > 0) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedDevListTeamNames([]);
                      setSelectedDevListRoleNames([]);
                    }}
                    style={{ height: '38px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto', margin: 0, fontSize: '0.8rem' }}
                  >
                    <X size={14} />
                    Reset Member Filters
                  </button>
                )}
              </div>

              {developers.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} />
                  <p>No team members found.</p>
                </div>
              ) : (
                <div className="list-scroll-container">
                  <table className="list-table">
                    <thead>
                      <tr>
                        <th 
                          onClick={() => setDevListSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', userSelect: 'none', ...getColStyle('dev-col-name', 220) }}
                          className="sortable-header"
                          title={`Sort by Developer Name ${devListSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Name</span>
                            {devListSortOrder === 'asc' ? (
                              <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <ArrowDown size={14} style={{ color: 'var(--accent-primary)' }} />
                            )}
                          </div>
                          <ColumnResizer colKey="dev-col-name" defaultWidth={220} minWidth={120} />
                        </th>
                        <th style={getColStyle('dev-col-role', 180)}>
                          Role
                          <ColumnResizer colKey="dev-col-role" defaultWidth={180} minWidth={100} />
                        </th>
                        <th style={getColStyle('dev-col-team', 140)}>
                          Team
                          <ColumnResizer colKey="dev-col-team" defaultWidth={140} minWidth={90} />
                        </th>
                        <th style={getColStyle('dev-col-login', 130)}>
                          Login ID
                          <ColumnResizer colKey="dev-col-login" defaultWidth={130} minWidth={80} />
                        </th>
                        <th style={getColStyle('dev-col-manager', 180)}>
                          Manager
                          <ColumnResizer colKey="dev-col-manager" defaultWidth={180} minWidth={100} />
                        </th>
                        <th style={getColStyle('dev-col-actions', 130)}>
                          Actions
                          <ColumnResizer colKey="dev-col-actions" defaultWidth={130} minWidth={90} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...developers]
                        .filter((dev) => {
                          const matchesTeam = selectedDevListTeamNames.length === 0 || selectedDevListTeamNames.includes(dev.team);
                          const matchesRole = selectedDevListRoleNames.length === 0 || selectedDevListRoleNames.includes(dev.role);
                          return matchesTeam && matchesRole;
                        })
                        .sort((a, b) => {
                          const nameA = (a.name || '').toLowerCase();
                          const nameB = (b.name || '').toLowerCase();
                          return devListSortOrder === 'asc'
                            ? nameA.localeCompare(nameB)
                            : nameB.localeCompare(nameA);
                        })
                        .map((dev) => (
                        editingDevId === dev.id ? (
                          <tr key={dev.id} style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                            <td style={getColStyle('dev-col-name', 220)}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Full Name"
                                  value={editDevName}
                                  onChange={(e) => setEditDevName(e.target.value)}
                                  required
                                />
                                <input 
                                  type="email" 
                                  className="form-input compact-input" 
                                  placeholder="Email (Optional)"
                                  value={editDevEmail}
                                  onChange={(e) => setEditDevEmail(e.target.value)}
                                />
                              </div>
                            </td>
                            <td style={getColStyle('dev-col-role', 180)}>
                              <input 
                                type="text" 
                                className="form-input compact-input" 
                                placeholder="Role/Title"
                                value={editDevRole}
                                onChange={(e) => setEditDevRole(e.target.value)}
                                required
                              />
                            </td>
                            <td style={getColStyle('dev-col-team', 140)}>
                              <select 
                                className="form-input compact-input" 
                                value={editDevTeamId}
                                onChange={(e) => setEditDevTeamId(e.target.value)}
                              >
                                <option value="">No Team</option>
                                {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </td>
                            <td style={getColStyle('dev-col-login', 130)}>
                              <input 
                                type="text" 
                                className="form-input compact-input" 
                                placeholder="Login ID"
                                value={editDevCompanyLoginId}
                                onChange={(e) => setEditDevCompanyLoginId(e.target.value)}
                              />
                            </td>
                            <td style={getColStyle('dev-col-manager', 180)}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Manager Name"
                                  value={editDevManagerName}
                                  onChange={(e) => setEditDevManagerName(e.target.value)}
                                />
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Manager ID"
                                  value={editDevManagerCompanyLoginId}
                                  onChange={(e) => setEditDevManagerCompanyLoginId(e.target.value)}
                                />
                              </div>
                            </td>
                            <td style={getColStyle('dev-col-actions', 130)}>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button 
                                  className="btn-primary" 
                                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                  onClick={() => handleUpdateDeveloper(dev.id)}
                                  disabled={loading}
                                >
                                  Save
                                </button>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                  onClick={() => setEditingDevId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={dev.id}>
                            <td style={getColStyle('dev-col-name', 220)}>
                              <div style={{ fontWeight: 600 }}>{dev.name}</div>
                              {dev.email && (
                                <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 500, marginTop: '0.15rem' }}>
                                  {dev.email}
                                </div>
                              )}
                            </td>
                            <td style={getColStyle('dev-col-role', 180)}>{dev.role}</td>
                            <td style={getColStyle('dev-col-team', 140)}>
                              <span 
                                className={`badge ${dev.team === 'No Team' ? 'no-team' : 'team-badge'}`}
                                style={{ pointerEvents: 'none' }}
                              >
                                {dev.team}
                              </span>
                            </td>
                            <td style={getColStyle('dev-col-login', 130)}>
                              <code>{dev.companyLoginId || '—'}</code>
                            </td>
                            <td style={getColStyle('dev-col-manager', 180)}>
                              {dev.managerName ? (
                                <div>
                                  <div style={{ fontWeight: 500 }}>{dev.managerName}</div>
                                  {dev.managerCompanyLoginId && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      ID: {dev.managerCompanyLoginId}
                                    </div>
                                  )}
                                </div>
                              ) : dev.managerCompanyLoginId ? (
                                <span style={{ fontSize: '0.85rem' }}>ID: {dev.managerCompanyLoginId}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={getColStyle('dev-col-actions', 130)}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto', height: '30px' }}
                                  onClick={() => {
                                    setEditingDevId(dev.id);
                                    setEditDevName(dev.name);
                                    setEditDevRole(dev.role);
                                    setEditDevEmail(dev.email || '');
                                    setEditDevManagerName(dev.managerName || '');
                                    setEditDevManagerCompanyLoginId(dev.managerCompanyLoginId || '');
                                    setEditDevCompanyLoginId(dev.companyLoginId || '');
                                    setEditDevTeamId(dev.teamId || '');
                                  }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn-secondary" 
                                  style={{ 
                                    padding: '0.3rem 0.6rem', 
                                    fontSize: '0.75rem', 
                                    width: 'auto',
                                    height: '30px',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444'
                                  }}
                                  onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Tracked Skills */}
          {activeTab === 'skills' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Tracked Skills List</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={handleExportSkills}
                    title="Export skills to CSV file"
                  >
                    <Download size={14} style={{ marginRight: '6px' }} />
                    Export CSV
                  </button>
                  <label 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}
                    title="Import skills from CSV file"
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} />
                    Import CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      style={{ display: 'none' }} 
                      onChange={handleImportSkills}
                    />
                  </label>
                </div>
              </div>
              
              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0, width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Skill Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. TypeScript" 
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0, width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Category</label>
                  <select 
                    className="form-select"
                    style={{ height: '42px', width: '100%' }}
                    value={newSkillCategoryId}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_CATEGORY') {
                        setCategoryRedirectTarget('skills');
                        setActiveTab('categories');
                        setNewSkillCategoryId('');
                      } else {
                        setNewSkillCategoryId(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option disabled>— Actions —</option>
                    <option value="ADD_CATEGORY">+ Add New Category...</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Vendor</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Microsoft (Optional)" 
                    value={newSkillVendor}
                    onChange={(e) => setNewSkillVendor(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0, width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Strongly typed language (Optional)" 
                    value={newSkillDescription}
                    onChange={(e) => setNewSkillDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ height: '42px', width: '100%' }} disabled={loading}>
                  <Plus size={16} />
                  Add Skill
                </button>
              </form>

              {/* Category & Vendor Filters Toolbar */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                alignItems: 'flex-end'
              }}>
                {/* 1. Filter by Category */}
                <div style={{ flex: '1', minWidth: '200px', position: 'relative', zIndex: isCategoryDropdownOpen ? 500 : 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Filter by Category ({selectedCategoryNames.length === 0 ? 'All' : `${selectedCategoryNames.length} selected`})
                  </label>
                  <button
                    ref={categoryBtnRef}
                    type="button"
                    className="form-select"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    style={{
                      height: '38px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderColor: isCategoryDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCategoryNames.length === 0
                        ? 'All Categories'
                        : selectedCategoryNames.length === 1
                        ? selectedCategoryNames[0]
                        : `${selectedCategoryNames.length} Categories Selected`}
                    </span>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        transform: isCategoryDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted)'
                      }} 
                    />
                  </button>

                  {isCategoryDropdownOpen && createPortal(
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                        onClick={() => setIsCategoryDropdownOpen(false)} 
                      />
                      <div
                        className="filter-dropdown-panel"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: '#0f172a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          padding: '0.5rem',
                          ...getPortalDropdownStyle(categoryBtnRef)
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsCategoryDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedCategoryNames.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedCategoryNames.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategoryNames.length === 0}
                                onChange={() => setSelectedCategoryNames([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedCategoryNames.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                        {[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((cat) => {
                          const cName = cat.name;
                          const isChecked = selectedCategoryNames.length === 0 || selectedCategoryNames.includes(cName);
                          return (
                            <label
                              key={cat.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: isChecked ? '#fff' : 'var(--text-secondary)',
                                background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (selectedCategoryNames.length === 0) {
                                    setSelectedCategoryNames([cName]);
                                  } else if (selectedCategoryNames.includes(cName)) {
                                    const next = selectedCategoryNames.filter(n => n !== cName);
                                    setSelectedCategoryNames(next.length === 0 ? [] : next);
                                  } else {
                                    const next = [...selectedCategoryNames, cName];
                                    setSelectedCategoryNames(next.length === categories.length ? [] : next);
                                  }
                                }}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: isChecked ? 600 : 400 }}>{cName}</span>
                            </label>
                          );
                        })}

                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem 0.5rem', width: '100%', textAlign: 'left', fontWeight: 500 }}
                            onClick={() => {
                              setIsCategoryDropdownOpen(false);
                              setCategoryRedirectTarget('skills');
                              setActiveTab('categories');
                            }}
                          >
                            + Add New Category...
                          </button>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>

                {/* 2. Filter by Vendor */}
                <div style={{ flex: '1', minWidth: '200px', position: 'relative', zIndex: isVendorDropdownOpen ? 500 : 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Filter by Vendor ({selectedVendorNames.length === 0 ? 'All' : `${selectedVendorNames.length} selected`})
                  </label>
                  <button
                    ref={vendorBtnRef}
                    type="button"
                    className="form-select"
                    onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                    style={{
                      height: '38px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderColor: isVendorDropdownOpen ? 'var(--accent-primary)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedVendorNames.length === 0
                        ? 'All Vendors'
                        : selectedVendorNames.length === 1
                        ? (selectedVendorNames[0] === 'NO_VENDOR' ? 'No Vendor Specified' : selectedVendorNames[0])
                        : `${selectedVendorNames.length} Vendors Selected`}
                    </span>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        transform: isVendorDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted)'
                      }} 
                    />
                  </button>

                  {isVendorDropdownOpen && createPortal(
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.5)' }} 
                        onClick={() => setIsVendorDropdownOpen(false)} 
                      />
                      <div
                        className="filter-dropdown-panel"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: '#0f172a',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          padding: '0.5rem',
                          ...getPortalDropdownStyle(vendorBtnRef)
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsVendorDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: selectedVendorNames.length === 0 ? '#fff' : 'var(--text-secondary)',
                                background: selectedVendorNames.length === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                transition: 'background 0.15s ease',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedVendorNames.length === 0}
                                onChange={() => setSelectedVendorNames([])}
                                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                                <span style={{ fontWeight: selectedVendorNames.length === 0 ? 600 : 400 }}>Select All</span>
                              </div>
                            </label>

                        {(() => {
                          const vendorList = [
                            ...Array.from(new Set(skills.map(s => s.vendor).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
                            'NO_VENDOR'
                          ];
                          return vendorList.map((v) => {
                            const isChecked = selectedVendorNames.length === 0 || selectedVendorNames.includes(v);
                            const displayLabel = v === 'NO_VENDOR' ? 'No Vendor Specified' : v;
                            return (
                              <label
                                key={v}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.45rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  color: isChecked ? '#fff' : 'var(--text-secondary)',
                                  background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (selectedVendorNames.length === 0) {
                                      setSelectedVendorNames([v]);
                                    } else if (selectedVendorNames.includes(v)) {
                                      const next = selectedVendorNames.filter(name => name !== v);
                                      setSelectedVendorNames(next.length === 0 ? [] : next);
                                    } else {
                                      const next = [...selectedVendorNames, v];
                                      setSelectedVendorNames(next.length === vendorList.length ? [] : next);
                                    }
                                  }}
                                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: isChecked ? 600 : 400 }}>{displayLabel}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </>,
                    document.body
                  )}
                </div>

                {(selectedCategoryNames.length > 0 || selectedVendorNames.length > 0) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedCategoryNames([]);
                      setSelectedVendorNames([]);
                    }}
                    style={{ height: '38px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto', margin: 0, fontSize: '0.8rem' }}
                  >
                    <X size={14} />
                    Reset Skill Filters
                  </button>
                )}
              </div>

              {skills.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={48} />
                  <p>No skills tracked yet.</p>
                </div>
              ) : (
                <div className="list-scroll-container">
                  <table className="list-table">
                    <thead>
                      <tr>
                        <th 
                          onClick={() => setSkillsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', userSelect: 'none', ...getColStyle('skill-col-name', 200) }}
                          className="sortable-header"
                          title={`Sort by Skill Name ${skillsSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Skill Name</span>
                            {skillsSortOrder === 'asc' ? (
                              <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <ArrowDown size={14} style={{ color: 'var(--accent-primary)' }} />
                            )}
                          </div>
                          <ColumnResizer colKey="skill-col-name" defaultWidth={200} minWidth={120} />
                        </th>
                        <th style={getColStyle('skill-col-cat', 150)}>
                          Category
                          <ColumnResizer colKey="skill-col-cat" defaultWidth={150} minWidth={90} />
                        </th>
                        <th style={getColStyle('skill-col-vendor', 140)}>
                          Vendor
                          <ColumnResizer colKey="skill-col-vendor" defaultWidth={140} minWidth={90} />
                        </th>
                        <th style={getColStyle('skill-col-desc', 260)}>
                          Description
                          <ColumnResizer colKey="skill-col-desc" defaultWidth={260} minWidth={120} />
                        </th>
                        <th style={getColStyle('skill-col-actions', 130)}>
                          Actions
                          <ColumnResizer colKey="skill-col-actions" defaultWidth={130} minWidth={90} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...skills]
                        .filter((skill) => {
                          const matchesCategory = selectedCategoryNames.length === 0 || selectedCategoryNames.includes(skill.category);
                          const matchesVendor = selectedVendorNames.length === 0
                            ? true
                            : selectedVendorNames.some(v => v === 'NO_VENDOR' ? !skill.vendor : skill.vendor === v);
                          return matchesCategory && matchesVendor;
                        })
                        .sort((a, b) => {
                          const nameA = (a.name || '').toLowerCase();
                          const nameB = (b.name || '').toLowerCase();
                          return skillsSortOrder === 'asc'
                            ? nameA.localeCompare(nameB)
                            : nameB.localeCompare(nameA);
                        })
                        .map((skill) => (
                          editingSkillId === skill.id ? (
                            <tr key={skill.id} style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                              <td style={getColStyle('skill-col-name', 200)}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Skill Name"
                                  value={editSkillName}
                                  onChange={(e) => setEditSkillName(e.target.value)}
                                  required
                                />
                              </td>
                              <td style={getColStyle('skill-col-cat', 150)}>
                                <select 
                                  className="form-input compact-input" 
                                  value={editSkillCategoryId}
                                  onChange={(e) => setEditSkillCategoryId(e.target.value)}
                                  required
                                >
                                  <option value="" disabled>Select Category</option>
                                  {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={getColStyle('skill-col-vendor', 140)}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Vendor"
                                  value={editSkillVendor}
                                  onChange={(e) => setEditSkillVendor(e.target.value)}
                                />
                              </td>
                              <td style={getColStyle('skill-col-desc', 260)}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Description"
                                  value={editSkillDescription}
                                  onChange={(e) => setEditSkillDescription(e.target.value)}
                                />
                              </td>
                              <td style={getColStyle('skill-col-actions', 130)}>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                    onClick={() => handleUpdateSkill(skill.id)}
                                    disabled={loading}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                    onClick={() => setEditingSkillId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={skill.id}>
                              <td style={getColStyle('skill-col-name', 200)}>
                                <div style={{ fontWeight: 600 }}>{skill.name}</div>
                              </td>
                              <td style={getColStyle('skill-col-cat', 150)}>
                                <span className="badge category-badge" style={{ pointerEvents: 'none' }}>
                                  {skill.category}
                                </span>
                              </td>
                              <td style={getColStyle('skill-col-vendor', 140)}>
                                {skill.vendor ? (
                                  <span className="badge vendor-badge" style={{ pointerEvents: 'none' }}>
                                    {skill.vendor}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td style={{ ...getColStyle('skill-col-desc', 260), whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {skill.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td style={getColStyle('skill-col-actions', 130)}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto', height: '30px' }}
                                    onClick={() => {
                                      setEditingSkillId(skill.id);
                                      setEditSkillName(skill.name);
                                      setEditSkillVendor(skill.vendor || '');
                                      setEditSkillDescription(skill.description || '');
                                      setEditSkillCategoryId(skill.category_id || '');
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ 
                                      padding: '0.3rem 0.6rem', 
                                      fontSize: '0.75rem', 
                                      width: 'auto',
                                      height: '30px',
                                      borderColor: 'rgba(239, 68, 68, 0.2)',
                                      color: '#ef4444'
                                    }}
                                    onClick={() => handleDeleteSkill(skill.id, skill.name)}
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Skill Categories */}
          {activeTab === 'categories' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Manage Categories</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={handleExportCategories}
                    title="Export categories to CSV file"
                  >
                    <Download size={14} style={{ marginRight: '6px' }} />
                    Export CSV
                  </button>
                  <label 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}
                    title="Import categories from CSV file"
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} />
                    Import CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      style={{ display: 'none' }} 
                      onChange={handleImportCategories}
                    />
                  </label>
                </div>
              </div>
              
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Category Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Mobile" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Android & iOS skills" 
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ height: '42px' }} disabled={loading}>
                  <Plus size={16} />
                  Add Category
                </button>
              </form>

              {categories.length === 0 ? (
                <div className="empty-state">
                  <LayoutGrid size={48} />
                  <p>No categories found.</p>
                </div>
              ) : (
                <div className="list-scroll-container">
                  <table className="list-table">
                    <thead>
                      <tr>
                        <th 
                          onClick={() => setCategoriesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', userSelect: 'none', ...getColStyle('cat-col-name', 220) }}
                          className="sortable-header"
                          title={`Sort by Category Name ${categoriesSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Category Name</span>
                            {categoriesSortOrder === 'asc' ? (
                              <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <ArrowDown size={14} style={{ color: 'var(--accent-primary)' }} />
                            )}
                          </div>
                          <ColumnResizer colKey="cat-col-name" defaultWidth={220} minWidth={120} />
                        </th>
                        <th style={getColStyle('cat-col-desc', 320)}>
                          Description
                          <ColumnResizer colKey="cat-col-desc" defaultWidth={320} minWidth={150} />
                        </th>
                        <th style={getColStyle('cat-col-actions', 130)}>
                          Actions
                          <ColumnResizer colKey="cat-col-actions" defaultWidth={130} minWidth={90} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...categories]
                        .sort((a, b) => {
                          const nameA = (a.name || '').toLowerCase();
                          const nameB = (b.name || '').toLowerCase();
                          return categoriesSortOrder === 'asc'
                            ? nameA.localeCompare(nameB)
                            : nameB.localeCompare(nameA);
                        })
                        .map((cat) => (
                          editingCategoryId === cat.id ? (
                            <tr key={cat.id} style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                              <td style={getColStyle('cat-col-name', 220)}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Category Name"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  required
                                />
                              </td>
                              <td style={getColStyle('cat-col-desc', 320)}>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Description"
                                  value={editCategoryDesc}
                                  onChange={(e) => setEditCategoryDesc(e.target.value)}
                                />
                              </td>
                              <td style={getColStyle('cat-col-actions', 130)}>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                    onClick={() => handleUpdateCategory(cat.id)}
                                    disabled={loading}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                    onClick={() => setEditingCategoryId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={cat.id}>
                              <td style={getColStyle('cat-col-name', 220)}>
                                <div style={{ fontWeight: 600 }}>{cat.name}</div>
                              </td>
                              <td style={{ ...getColStyle('cat-col-desc', 320), whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {cat.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td style={getColStyle('cat-col-actions', 130)}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: '30px' }}
                                    onClick={() => {
                                      setEditingCategoryId(cat.id);
                                      setEditCategoryName(cat.name);
                                      setEditCategoryDesc(cat.description || '');
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ 
                                      padding: '0.35rem 0.75rem', 
                                      fontSize: '0.8rem', 
                                      width: 'auto',
                                      height: '30px',
                                      borderColor: 'rgba(239, 68, 68, 0.2)',
                                      color: '#ef4444'
                                    }}
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Teams Management */}
          {activeTab === 'teams' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Teams Management</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={handleExportTeams}
                    title="Export teams to CSV file"
                  >
                    <Download size={14} style={{ marginRight: '6px' }} />
                    Export CSV
                  </button>
                  <label 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}
                    title="Import teams from CSV file"
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} />
                    Import CSV
                    <input 
                      type="file" 
                      accept=".csv" 
                      style={{ display: 'none' }} 
                      onChange={handleImportTeams}
                    />
                  </label>
                </div>
              </div>
              
              {/* Add Team Form */}
              <form onSubmit={handleAddTeam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Team Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. BI Development" 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Analytics & Data Warehouse" 
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ height: '42px' }}>
                  <Plus size={16} />
                  Add Team
                </button>
              </form>

              {teams.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={48} />
                  <p>No teams found.</p>
                </div>
              ) : (
                <div className="list-scroll-container">
                  <table className="list-table">
                    <thead>
                      <tr>
                        <th 
                          onClick={() => setTeamsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', userSelect: 'none', ...getColStyle('team-col-name', 200) }}
                          className="sortable-header"
                          title={`Sort by Team Name ${teamsSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Team Name</span>
                            {teamsSortOrder === 'asc' ? (
                              <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
                            ) : (
                              <ArrowDown size={14} style={{ color: 'var(--accent-primary)' }} />
                            )}
                          </div>
                          <ColumnResizer colKey="team-col-name" defaultWidth={200} minWidth={120} />
                        </th>
                        <th style={getColStyle('team-col-desc', 260)}>
                          Description
                          <ColumnResizer colKey="team-col-desc" defaultWidth={260} minWidth={120} />
                        </th>
                        <th style={{ ...getColStyle('team-col-members', 170), whiteSpace: 'nowrap' }}>
                          Members
                          <ColumnResizer colKey="team-col-members" defaultWidth={170} minWidth={100} />
                        </th>
                        <th style={getColStyle('team-col-skills', 260)}>
                          Assigned Skills
                          <ColumnResizer colKey="team-col-skills" defaultWidth={260} minWidth={120} />
                        </th>
                        <th style={{ ...getColStyle('team-col-actions', 130), whiteSpace: 'nowrap' }}>
                          Actions
                          <ColumnResizer colKey="team-col-actions" defaultWidth={130} minWidth={90} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...teams]
                        .sort((a, b) => {
                          const nameA = (a.name || '').toLowerCase();
                          const nameB = (b.name || '').toLowerCase();
                          return teamsSortOrder === 'asc'
                            ? nameA.localeCompare(nameB)
                            : nameB.localeCompare(nameA);
                        })
                        .map((team) => {
                          const memberCount = developers.filter(d => d.teamId === team.id).length;
                          const assignedSkillIds = teamSkills.filter(ts => ts.team_id === team.id).map(ts => ts.skill_id);
                          const assignedSkills = skills.filter(s => assignedSkillIds.includes(s.id));
                          
                          return (
                            <React.Fragment key={team.id}>
                              {editingTeamId === team.id ? (
                                <tr style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                  <td style={getColStyle('team-col-name', 200)}>
                                    <input 
                                      type="text" 
                                      className="form-input compact-input" 
                                      placeholder="Team Name"
                                      value={editTeamName}
                                      onChange={(e) => setEditTeamName(e.target.value)}
                                      required
                                    />
                                  </td>
                                  <td style={getColStyle('team-col-desc', 260)}>
                                    <input 
                                      type="text" 
                                      className="form-input compact-input" 
                                      placeholder="Description"
                                      value={editTeamDesc}
                                      onChange={(e) => setEditTeamDesc(e.target.value)}
                                    />
                                  </td>
                                  <td style={getColStyle('team-col-members', 170)}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                    </span>
                                  </td>
                                  <td style={getColStyle('team-col-skills', 260)}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      {assignedSkills.length} {assignedSkills.length === 1 ? 'skill' : 'skills'}
                                    </span>
                                  </td>
                                  <td style={getColStyle('team-col-actions', 130)}>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      <button 
                                        className="btn-primary" 
                                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                        onClick={() => handleUpdateTeam(team.id)}
                                        disabled={loading}
                                      >
                                        Save
                                      </button>
                                      <button 
                                        className="btn-secondary" 
                                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto', height: '32px' }}
                                        onClick={() => setEditingTeamId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <>
                                  <tr>
                                    <td style={{ ...getColStyle('team-col-name', 200), whiteSpace: 'nowrap' }}>
                                      <div style={{ fontWeight: 600 }}>{team.name}</div>
                                    </td>
                                    <td style={{ ...getColStyle('team-col-desc', 260), whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {team.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td style={{ ...getColStyle('team-col-members', 170), whiteSpace: 'nowrap' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <button 
                                          className={`badge ${memberCount > 0 ? 'team-badge' : 'no-team'}`} 
                                          style={{ 
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            ...(expandedTeamId === team.id ? { outline: '2px solid var(--accent-primary)', outlineOffset: '1px' } : {})
                                          }}
                                          onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                          title="Click to view team details & manage skills"
                                        >
                                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                        </button>
                                        <button 
                                          type="button"
                                          className="btn-secondary" 
                                          style={{ 
                                            padding: '0.15rem 0.5rem', 
                                            fontSize: '0.72rem', 
                                            height: '24px', 
                                            width: 'auto',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            borderColor: 'rgba(139, 92, 246, 0.4)',
                                            color: 'var(--accent-primary)'
                                          }}
                                          onClick={() => {
                                            setExpandedTeamId(team.id);
                                            setShowInlineAddMemberTeamId(showInlineAddMemberTeamId === team.id ? null : team.id);
                                          }}
                                          title={`Add or assign members to ${team.name}`}
                                        >
                                          <UserPlus size={12} />
                                          Add Member
                                        </button>
                                      </div>
                                    </td>
                                    <td style={getColStyle('team-col-skills', 260)}>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                        <button 
                                          className="btn-secondary" 
                                          style={{ 
                                            padding: '0.15rem 0.55rem', 
                                            fontSize: '0.72rem', 
                                            height: '24px', 
                                            marginRight: '0.25rem', 
                                            width: 'auto',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            ...(expandedTeamId === team.id ? { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)' } : {})
                                          }}
                                          onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                          title={expandedTeamId === team.id ? "Click to close line item" : "Click to manage assigned skills"}
                                        >
                                          {expandedTeamId === team.id ? (
                                            <>
                                              <X size={12} />
                                              Close
                                            </>
                                          ) : 'Manage'}
                                        </button>
                                        {assignedSkills.length === 0 ? (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None assigned</span>
                                        ) : (
                                          assignedSkills.slice(0, 3).map(sk => (
                                            <span key={sk.id} className="badge category-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                                              {sk.name}
                                            </span>
                                          ))
                                        )}
                                        {assignedSkills.length > 3 && (
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            +{assignedSkills.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ ...getColStyle('team-col-actions', 130), whiteSpace: 'nowrap' }}>
                                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button 
                                          className="btn-secondary" 
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', height: '30px' }}
                                          onClick={() => {
                                            setEditingTeamId(team.id);
                                            setEditTeamName(team.name);
                                            setEditTeamDesc(team.description || '');
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          className="btn-secondary" 
                                          style={{ 
                                            padding: '0.35rem 0.75rem', 
                                            fontSize: '0.8rem', 
                                            width: 'auto',
                                            height: '30px',
                                            borderColor: 'rgba(239, 68, 68, 0.2)',
                                            color: '#ef4444'
                                          }}
                                          onClick={() => handleDeleteTeam(team.id, team.name)}
                                          disabled={loading}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {expandedTeamId === team.id && (
                                    <tr style={{ background: 'rgba(15, 23, 42, 0.25)' }}>
                                      <td colSpan={5} style={{ padding: '1rem 1.5rem' }}>
                                        {/* Top Header Control Bar for Line Item */}
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginBottom: '0.85rem',
                                          paddingBottom: '0.6rem',
                                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={16} color="var(--accent-primary)" />
                                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                              Managing Team Capabilities: <strong style={{ color: 'var(--accent-primary)' }}>{team.name}</strong>
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setExpandedTeamId(null)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.35rem',
                                              padding: '0.25rem 0.7rem',
                                              fontSize: '0.78rem',
                                              height: '28px',
                                              width: 'auto',
                                              background: 'rgba(239, 68, 68, 0.12)',
                                              borderColor: 'rgba(239, 68, 68, 0.3)',
                                              color: '#f87171'
                                            }}
                                            title="Close assigned skills manager for this line item"
                                          >
                                            <X size={13} />
                                            Close Line Item
                                          </button>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                                          {/* Left Box: Team Members (Dynamic fit-content width, no name wrapping) */}
                                          <div style={{
                                            flex: '0 0 auto',
                                            width: 'fit-content',
                                            minWidth: '300px',
                                            maxWidth: '480px',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.4rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>Team Members</h5>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({memberCount})</span>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() => {
                                                  if (showInlineAddMemberTeamId === team.id) {
                                                    setShowInlineAddMemberTeamId(null);
                                                  } else {
                                                    setShowInlineAddMemberTeamId(team.id);
                                                  }
                                                }}
                                                style={{ height: '24px', padding: '0 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto', margin: 0, borderColor: 'rgba(139, 92, 246, 0.3)', color: 'var(--accent-primary)' }}
                                                title="Assign existing team member or add new member on the fly"
                                              >
                                                <UserPlus size={12} />
                                                Add Member
                                              </button>
                                            </div>

                                            {/* Inline Member Add Form & Selector Drawer */}
                                            {showInlineAddMemberTeamId === team.id && (
                                              <div style={{ 
                                                background: 'rgba(15, 23, 42, 0.6)', 
                                                border: '1px solid var(--accent-primary)', 
                                                borderRadius: '6px', 
                                                padding: '0.75rem', 
                                                marginTop: '0.25rem', 
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.6rem'
                                              }}>
                                                {/* Option 1: Assign Existing Member */}
                                                <div>
                                                  <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Users size={12} />
                                                    Assign Existing Member to {team.name}:
                                                  </div>
                                                  <select
                                                    className="form-input compact-input"
                                                    style={{ fontSize: '0.78rem', height: '30px', width: '100%' }}
                                                    value=""
                                                    onChange={(e) => {
                                                      if (e.target.value) {
                                                        handleAssignDeveloperToTeam(e.target.value, team.id);
                                                      }
                                                    }}
                                                  >
                                                    <option value="">-- Choose Existing Member --</option>
                                                    {developers.map(dev => (
                                                      <option key={dev.id} value={dev.id}>
                                                        {dev.name} ({dev.role || 'Developer'}) — {dev.teamId === team.id ? 'Already in this team' : dev.team ? `In ${dev.team}` : 'No Team'}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>

                                                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.2rem 0' }} />

                                                {/* Option 2: Create & Add New Member on the Fly */}
                                                <form onSubmit={(e) => handleCreateAndAssignMember(e, team.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                  <div style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <UserPlus size={12} />
                                                    Create & Add New Member on the fly:
                                                  </div>
                                                  <input
                                                    type="text"
                                                    className="form-input compact-input"
                                                    placeholder="Full Name (e.g. Sarah Connor)"
                                                    value={inlineMemberName}
                                                    onChange={(e) => setInlineMemberName(e.target.value)}
                                                    style={{ fontSize: '0.78rem', height: '30px' }}
                                                    required
                                                  />
                                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                                    <input
                                                      type="text"
                                                      className="form-input compact-input"
                                                      placeholder="Role Title (e.g. Senior Frontend)"
                                                      value={inlineMemberRole}
                                                      onChange={(e) => setInlineMemberRole(e.target.value)}
                                                      style={{ fontSize: '0.78rem', height: '30px' }}
                                                    />
                                                    <input
                                                      type="email"
                                                      className="form-input compact-input"
                                                      placeholder="Email (Optional)"
                                                      value={inlineMemberEmail}
                                                      onChange={(e) => setInlineMemberEmail(e.target.value)}
                                                      style={{ fontSize: '0.78rem', height: '30px' }}
                                                    />
                                                  </div>
                                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                                                    <button
                                                      type="button"
                                                      className="btn-secondary"
                                                      onClick={() => setShowInlineAddMemberTeamId(null)}
                                                      style={{ height: '26px', padding: '0 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                                                    >
                                                      Cancel
                                                    </button>
                                                    <button
                                                      type="submit"
                                                      className="btn-primary"
                                                      disabled={loading}
                                                      style={{ height: '26px', padding: '0 0.75rem', fontSize: '0.75rem', width: 'auto' }}
                                                    >
                                                      <UserPlus size={12} />
                                                      Create & Assign
                                                    </button>
                                                  </div>
                                                </form>
                                              </div>
                                            )}

                                            {developers.filter(d => d.teamId === team.id).length === 0 ? (
                                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                No members in this team yet. Click "Add Member" above to assign developers.
                                              </div>
                                            ) : (
                                              developers.filter(d => d.teamId === team.id).map(dev => (
                                                <div key={dev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', gap: '0.5rem', padding: '0.2rem 0' }}>
                                                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'left', whiteSpace: 'nowrap' }}>{dev.name}</span>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right', whiteSpace: 'nowrap' }}>{dev.role}</span>
                                                    <button
                                                      type="button"
                                                      className="btn-secondary"
                                                      onClick={() => handleAssignDeveloperToTeam(dev.id, null)}
                                                      style={{ padding: '0 0.35rem', height: '22px', fontSize: '0.7rem', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', width: 'auto', display: 'inline-flex', alignItems: 'center' }}
                                                      title={`Remove ${dev.name} from ${team.name}`}
                                                    >
                                                      <X size={11} />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>

                                          {/* Right Box: Team Assigned Skills (Utilizes all remaining line item width) */}
                                          <div style={{
                                            flex: '1 1 320px',
                                            minWidth: 0,
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.4rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>Assigned Team Skills</h5>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({assignedSkills.length})</span>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() => {
                                                  if (showInlineAddSkillTeamId === team.id) {
                                                    setShowInlineAddSkillTeamId(null);
                                                  } else {
                                                    setShowInlineAddSkillTeamId(team.id);
                                                    if (categories.length > 0 && !inlineSkillCategoryId) {
                                                      setInlineSkillCategoryId(categories[0].id);
                                                    }
                                                  }
                                                }}
                                                style={{ height: '24px', padding: '0 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'auto', margin: 0, borderColor: 'rgba(139, 92, 246, 0.3)', color: 'var(--accent-primary)' }}
                                                title="Create a brand new skill and automatically assign it to this team"
                                              >
                                                <Plus size={12} />
                                                Add Skill on the fly
                                              </button>
                                            </div>

                                            {showInlineAddSkillTeamId === team.id && (
                                              <form 
                                                onSubmit={(e) => handleCreateAndAssignSkill(e, team.id)} 
                                                style={{ 
                                                  background: 'rgba(15, 23, 42, 0.6)', 
                                                  border: '1px solid var(--accent-primary)', 
                                                  borderRadius: '6px', 
                                                  padding: '0.75rem', 
                                                  marginTop: '0.25rem', 
                                                  marginBottom: '0.5rem',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '0.5rem'
                                                }}
                                              >
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                  <BookOpen size={13} />
                                                  Create & Auto-Assign to {team.name}:
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                                  <input
                                                    type="text"
                                                    className="form-input compact-input"
                                                    placeholder="Skill Name (e.g. Crystal Reports)"
                                                    value={inlineSkillName}
                                                    onChange={(e) => setInlineSkillName(e.target.value)}
                                                    style={{ fontSize: '0.78rem', height: '30px' }}
                                                    required
                                                  />
                                                  <select
                                                    className="form-input compact-input"
                                                    value={inlineSkillCategoryId}
                                                    onChange={(e) => setInlineSkillCategoryId(e.target.value)}
                                                    style={{ fontSize: '0.78rem', height: '30px' }}
                                                    required
                                                  >
                                                    <option value="" disabled>Select Category</option>
                                                    {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                      <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                                  <input
                                                    type="text"
                                                    className="form-input compact-input"
                                                    placeholder="Vendor (e.g. SAP - Optional)"
                                                    value={inlineSkillVendor}
                                                    onChange={(e) => setInlineSkillVendor(e.target.value)}
                                                    style={{ fontSize: '0.78rem', height: '30px' }}
                                                  />
                                                  <input
                                                    type="text"
                                                    className="form-input compact-input"
                                                    placeholder="Description (Optional)"
                                                    value={inlineSkillDescription}
                                                    onChange={(e) => setInlineSkillDescription(e.target.value)}
                                                    style={{ fontSize: '0.78rem', height: '30px' }}
                                                  />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                                                  <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => setShowInlineAddSkillTeamId(null)}
                                                    style={{ height: '26px', padding: '0 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    type="submit"
                                                    className="btn-primary"
                                                    disabled={loading}
                                                    style={{ height: '26px', padding: '0 0.75rem', fontSize: '0.75rem', width: 'auto' }}
                                                  >
                                                    <Plus size={12} />
                                                    Create & Assign
                                                  </button>
                                                </div>
                                              </form>
                                            )}

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                              Click skills to assign or remove them from <strong>{team.name}</strong>:
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                              {skills.map(skill => {
                                                const isAssigned = assignedSkillIds.includes(skill.id);
                                                return (
                                                  <button
                                                    key={skill.id}
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => handleToggleTeamSkill(team.id, skill.id)}
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: '0.35rem',
                                                      padding: '0.25rem 0.6rem',
                                                      borderRadius: '6px',
                                                      fontSize: '0.75rem',
                                                      border: isAssigned ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                                      background: isAssigned ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                                      color: isAssigned ? '#fff' : 'var(--text-muted)',
                                                      cursor: 'pointer',
                                                      transition: 'all 0.15s ease'
                                                    }}
                                                    title={isAssigned ? 'Click to remove skill' : 'Click to assign skill'}
                                                  >
                                                    {isAssigned ? <Check size={12} style={{ color: 'var(--accent-primary)' }} /> : <Plus size={12} />}
                                                    <span>{skill.name}</span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
                  {activeTab === 'docs' && (
            <div className="glass-panel" style={{ padding: '1.75rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
              {/* Action Toolbar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <BookOpen size={24} color="var(--accent-primary)" />
                  <div>
                    <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)' }}>User Guide & Technical Architecture Documentation</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exhaustive manual, Star Schema database architecture, temporal audit specs, and step-by-step workflows</p>
                  </div>
                </div>

                {/* Toolbar Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleExportDocx}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '34px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Export Documentation to Microsoft Word Document (.doc)"
                  >
                    <FileText size={14} />
                    Export Word (.doc)
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleExportMarkdown}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '34px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Export Documentation to Markdown (.md)"
                  >
                    <Download size={14} />
                    Export .md
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handlePrintPdf}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', height: '34px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Save or Print as PDF Document"
                  >
                    <Printer size={14} />
                    Print / PDF
                  </button>
                </div>
              </div>

              {/* Complete Documentation Body Container */}
              <div 
                id="doc-modal-body" 
                style={{ 
                  lineHeight: '1.75', 
                  fontSize: '0.93rem', 
                  color: 'var(--text-primary)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '1.75rem 2rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h1 style={{ fontSize: '1.75rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', marginTop: 0 }}>Skills Matrix Application — User Guide & Feature Documentation</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Welcome to the complete user guide and technical documentation for the Skills Matrix Application. You can view, save, or export this document to Word (.doc), Markdown (.md), or PDF format at any time using the toolbar above.
                </p>

                <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '1.5rem' }}>📋 Executive Overview</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The <strong>Skills Matrix Application</strong> provides engineering managers, team leads, and HR leaders with complete visibility into the technical capabilities of their organization. By mapping team members against a catalog of tracked skills and competency levels (from 0 to 5 stars), the application enables data-driven decision-making for:
                </p>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Resource Allocation & Project Staffing</strong>: Quickly locate team members with specific technical mastery (e.g., Expert in React or Strong in PostgreSQL).</li>
                  <li><strong>Skill Gap Identification</strong>: Contrast team skill requirements against actual team capabilities to identify training needs or hiring priorities.</li>
                  <li><strong>Team Capability Benchmarking</strong>: Measure category-level and team-level proficiency metrics in real time.</li>
                  <li><strong>Data Management & Governance</strong>: Seamlessly import/export team rosters and connect to PostgreSQL via Supabase with full Row-Level Security (RLS).</li>
                  <li><strong>Historical Progress Tracking</strong>: Preserve immutable rating change histories using temporal boolean flags (<code>is_current = true / false</code>) to enable long-term team growth reports.</li>
                </ul>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>🏗️ Architecture & Technical Stack</h2>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Frontend Core</strong>: React 19, Vite, JavaScript (ES Modules).</li>
                  <li><strong>Icons & Visuals</strong>: Lucide React icon suite.</li>
                  <li><strong>Styling & Theme</strong>: Modern Vanilla CSS featuring a dark-mode <strong>Glassmorphism Design System</strong> with custom properties, smooth transitions, star rating widgets, and responsive layout containers.</li>
                  <li><strong>Backend & Database</strong>: Supabase PostgreSQL connection with fallback to an <strong>Autonomous Demo Mode</strong> featuring pre-populated mock datasets.</li>
                  <li><strong>Code Quality</strong>: Oxlint integration for fast linting.</li>
                </ul>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>🗄️ Database Architecture & Star Schema Specification</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The database architecture is designed using a <strong>Dimensional Data Modeling / Star Schema</strong> pattern optimized for both fast online transactional queries (OLTP) and analytical progress reporting (OLAP).
                </p>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>📐 Entity-Relationship Star Schema Diagram</h3>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', color: '#f8fafc', overflowX: 'auto', fontSize: '0.82rem', margin: '0.75rem 0' }}>
{`+-----------------------+         +-------------------------------+         +-----------------------+
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
                                  +-------------------------------+`}
                </pre>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.5rem' }}>📑 Full Database Table Schemas & Data Types</h3>
                <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                  <table className="list-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Table Name</th>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Key / Constraint</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>id</code></td>
                        <td>UUID</td>
                        <td>PRIMARY KEY</td>
                        <td>Unique developer ID (<code>gen_random_uuid()</code>)</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>full_name</code></td>
                        <td>VARCHAR(255)</td>
                        <td>NOT NULL</td>
                        <td>Full name of the team member</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>role_title</code></td>
                        <td>VARCHAR(255)</td>
                        <td>DEFAULT 'Developer'</td>
                        <td>Role / Job title (e.g. Senior Frontend Engineer)</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>email</code></td>
                        <td>VARCHAR(255)</td>
                        <td>NULLABLE</td>
                        <td>Email address</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>company_login_id</code></td>
                        <td>VARCHAR(100)</td>
                        <td>NULLABLE</td>
                        <td>Corporate login identifier / SSO handle</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>manager_fullname</code></td>
                        <td>VARCHAR(255)</td>
                        <td>NULLABLE</td>
                        <td>Reporting manager full name</td>
                      </tr>
                      <tr>
                        <td><strong>person</strong></td>
                        <td><code>manager_company_login_id</code></td>
                        <td>VARCHAR(100)</td>
                        <td>NULLABLE</td>
                        <td>Reporting manager corporate ID</td>
                      </tr>
                      <tr>
                        <td><strong>skills</strong></td>
                        <td><code>id</code></td>
                        <td>UUID</td>
                        <td>PRIMARY KEY</td>
                        <td>Unique skill identifier</td>
                      </tr>
                      <tr>
                        <td><strong>skills</strong></td>
                        <td><code>name</code></td>
                        <td>VARCHAR(255)</td>
                        <td>NOT NULL</td>
                        <td>Skill name (e.g. React, PostgreSQL)</td>
                      </tr>
                      <tr>
                        <td><strong>skills</strong></td>
                        <td><code>category_id</code></td>
                        <td>INT</td>
                        <td>FK -&gt; categories(id)</td>
                        <td>Associated domain taxonomy ID</td>
                      </tr>
                      <tr>
                        <td><strong>skills</strong></td>
                        <td><code>vendor</code></td>
                        <td>VARCHAR(255)</td>
                        <td>NULLABLE</td>
                        <td>Vendor or technology provider</td>
                      </tr>
                      <tr>
                        <td><strong>skills</strong></td>
                        <td><code>description</code></td>
                        <td>TEXT</td>
                        <td>NULLABLE</td>
                        <td>Detailed description of the skill</td>
                      </tr>
                      <tr>
                        <td><strong>categories</strong></td>
                        <td><code>id</code></td>
                        <td>SERIAL / INT</td>
                        <td>PRIMARY KEY</td>
                        <td>Category surrogate ID</td>
                      </tr>
                      <tr>
                        <td><strong>categories</strong></td>
                        <td><code>name</code></td>
                        <td>VARCHAR(100)</td>
                        <td>NOT NULL</td>
                        <td>Category domain (Frontend, Backend, DevOps, etc.)</td>
                      </tr>
                      <tr>
                        <td><strong>teams</strong></td>
                        <td><code>id</code></td>
                        <td>SERIAL / INT</td>
                        <td>PRIMARY KEY</td>
                        <td>Team surrogate ID</td>
                      </tr>
                      <tr>
                        <td><strong>teams</strong></td>
                        <td><code>name</code></td>
                        <td>VARCHAR(100)</td>
                        <td>NOT NULL</td>
                        <td>Team name (e.g. Core Engineering, Platform)</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>id</code></td>
                        <td>UUID</td>
                        <td>PRIMARY KEY</td>
                        <td>Assessment record ID</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>person_id</code></td>
                        <td>UUID</td>
                        <td>FK -&gt; person(id) CASCADE</td>
                        <td>Assessed developer ID</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>skill_id</code></td>
                        <td>UUID</td>
                        <td>FK -&gt; skills(id) CASCADE</td>
                        <td>Assessed skill ID</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>competency_level_id</code></td>
                        <td>INT</td>
                        <td>CHECK (1..5)</td>
                        <td>Rating level from 1 (Basic) to 5 (Expert)</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>is_current</code></td>
                        <td>BOOLEAN</td>
                        <td>DEFAULT true</td>
                        <td>True for active current rating; false for past ratings</td>
                      </tr>
                      <tr>
                        <td><strong>person_skill_assessments</strong></td>
                        <td><code>valid_from / valid_to</code></td>
                        <td>DATE</td>
                        <td>NULLABLE</td>
                        <td>SCD Type 2 audit timeline range</td>
                      </tr>
                      <tr>
                        <td><strong>team_skills</strong></td>
                        <td><code>team_id / skill_id</code></td>
                        <td>INT / UUID</td>
                        <td>FK CASCADE</td>
                        <td>Target team requirement mapping</td>
                      </tr>
                      <tr>
                        <td><strong>person_teams</strong></td>
                        <td><code>person_id / team_id</code></td>
                        <td>UUID / INT</td>
                        <td>FK CASCADE</td>
                        <td>Developer team roster placement bridge</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', margin: '1.25rem 0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>🌟 Fact Tables vs. Dimension Tables Breakdown</h4>
                  
                  <h5 style={{ color: '#c4b5fd', margin: '0.75rem 0 0.35rem 0', fontSize: '0.95rem' }}>1. Fact Tables (Event & Assessment Data)</h5>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li><strong><code>person_skill_assessments</code> (Periodic Assessment Fact Table)</strong>: Stores developer competency ratings (1 to 5 stars), developer FK, skill FK, and temporal audit attributes (<code>is_current</code>, <code>valid_from</code>, <code>valid_to</code>, <code>assessed_on</code>).</li>
                    <li><strong><code>team_skills</code> (Team Requirement Fact Table)</strong>: Stores target required skills per team (<code>is_required</code>, <code>is_current</code>, <code>valid_from</code>, <code>valid_to</code>).</li>
                    <li><strong><code>person_teams</code> (Team Placement Fact / Bridge Table)</strong>: Maps developers to operational teams over time (<code>is_current</code>, <code>valid_from</code>, <code>valid_to</code>).</li>
                  </ul>

                  <h5 style={{ color: '#c4b5fd', margin: '1rem 0 0.35rem 0', fontSize: '0.95rem' }}>2. Dimension Tables (Context & Attributes)</h5>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li><strong><code>person</code> (Developer Dimension)</strong>: Personnel context (Full Name, Role Title, Email, Company Login ID, Manager Full Name, Manager Login ID).</li>
                    <li><strong><code>skills</code> (Skill Dimension)</strong>: Catalog metadata (Skill Name, Vendor, Description, Foreign Key to Category).</li>
                    <li><strong><code>categories</code> (Taxonomy Dimension)</strong>: Skill domains (Frontend, Backend, Database, DevOps, etc.).</li>
                    <li><strong><code>teams</code> (Organizational Team Dimension)</strong>: Team names and descriptions.</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', margin: '1.25rem 0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>🔑 Key Database Technical Highlights</h4>
                  <ol style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li><strong>Surrogate Keys & UUID Primary Keys</strong>: Uses UUID primary keys (<code>gen_random_uuid()</code>) for core data tables to prevent key collision issues across distributed systems and CSV imports. Uses integer surrogate keys (<code>SERIAL</code>) for static taxonomies.</li>
                    <li><strong>Referential Integrity & Cascading</strong>: Foreign keys enforce relational integrity with <code>ON DELETE CASCADE</code> clauses (e.g., deleting a team member purges their associated assessments automatically).</li>
                    <li><strong>Row-Level Security (RLS)</strong>: PostgreSQL Row-Level Security policies are enabled across all tables (<code>ALTER TABLE ... ENABLE ROW LEVEL SECURITY</code>).</li>
                    <li>
                      <strong>Recommended Performance Indexes</strong>:
                      <pre style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '6px', marginTop: '0.5rem', color: '#f8fafc', overflowX: 'auto', fontSize: '0.85rem' }}>
{`-- Optimize active assessment queries for matrix grid loading
CREATE INDEX idx_psa_current ON person_skill_assessments (person_id, skill_id) WHERE is_current = true;

-- Optimize temporal history queries for team progress reporting
CREATE INDEX idx_psa_history ON person_skill_assessments (person_id, valid_from, valid_to);

-- Optimize current team member lookups
CREATE INDEX idx_pt_current ON person_teams (person_id, team_id) WHERE is_current = true;`}
                      </pre>
                    </li>
                  </ol>
                </div>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>🕒 Temporal Audit Model & Progress Tracking (SCD Type 2)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  To enable managers to track team progress and skill development over time, the database implements a <strong>Slowly Changing Dimension (SCD Type 2)</strong> temporal design:
                </p>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li>When a skill level is added or updated for a developer, the previous active record is updated to <code>is_current = false</code> with <code>valid_to = CURRENT_DATE</code>.</li>
                  <li>A new active record is inserted with <code>is_current = true</code>, <code>valid_from = CURRENT_DATE</code>, and <code>assessed_on = CURRENT_DATE</code>.</li>
                  <li>This preserves an immutable, auditable timeline of skill growth over quarters for future progress reporting.</li>
                </ul>

                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', color: '#f8fafc', overflowX: 'auto', fontSize: '0.85rem', margin: '1rem 0' }}>
{`Timeline of Skill Assessments (e.g. John Doe - React):
+-----------------------------------------------------------------------------------------------+
| ID | Person | Skill | Level | is_current | valid_from | valid_to   | Description              |
+----+--------+-------+-------+------------+------------+------------+--------------------------+
| #1 | John   | React | 1     | FALSE      | 2026-01-01 | 2026-04-15 | Initial Assessment       |
| #2 | John   | React | 3     | FALSE      | 2026-04-15 | 2026-08-23 | Mid-Year Progress Review |
| #3 | John   | React | 4     | TRUE       | 2026-08-23 | NULL       | Active Current Rating    |
+-----------------------------------------------------------------------------------------------+`}
                </pre>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>⚡ Connection Modes & Database Setup</h2>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>🟡 Autonomous Demo Mode</strong>: Activated when Supabase credentials are missing or unreachable. Uses pre-loaded mock datasets for instant offline evaluation.</li>
                  <li><strong>🟢 Supabase Database Connection</strong>: Connects directly to cloud PostgreSQL via Supabase with live status indicators and 1-click SQL setup script generator.</li>
                </ul>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>⭐ Competency Level Scale Reference</h2>
                <table className="list-table" style={{ margin: '1rem 0' }}>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Rating</th>
                      <th>Label</th>
                      <th>Description & Expectations</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>0</strong></td>
                      <td>☆☆☆☆☆</td>
                      <td><strong>0 – None</strong></td>
                      <td>No prior experience or knowledge of the skill.</td>
                    </tr>
                    <tr>
                      <td><strong>1</strong></td>
                      <td>★☆☆☆☆</td>
                      <td><strong>1 – Basic</strong></td>
                      <td>Can follow step-by-step examples and tutorials; requires active guidance.</td>
                    </tr>
                    <tr>
                      <td><strong>2</strong></td>
                      <td>★★☆☆☆</td>
                      <td><strong>2 – Emerging</strong></td>
                      <td>Completes simple tasks independently; familiar with core syntax and concepts.</td>
                    </tr>
                    <tr>
                      <td><strong>3</strong></td>
                      <td>★★★☆☆</td>
                      <td><strong>3 – Competent</strong></td>
                      <td>Works independently on routine tasks; writes production-ready code for standard scenarios.</td>
                    </tr>
                    <tr>
                      <td><strong>4</strong></td>
                      <td>★★★★☆</td>
                      <td><strong>4 – Strong</strong></td>
                      <td>Solves complex architectural problems, optimizes performance, and mentors junior team members.</td>
                    </tr>
                    <tr>
                      <td><strong>5</strong></td>
                      <td>★★★★★</td>
                      <td><strong>5 – Expert</strong></td>
                      <td>Deep mastery; defines engineering standards, authors internal libraries, and teaches organization-wide.</td>
                    </tr>
                  </tbody>
                </table>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>📱 Navigation Tabs Menu Bar Overview</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The application top navigation bar features <strong>6 primary interactive tabs</strong>. Each tab header includes a Lucide icon and real-time counter badges that reflect active database queries:
                </p>
                <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                  <table className="list-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Menu Item</th>
                        <th>Tab Key</th>
                        <th>Badge / Counter</th>
                        <th>Primary Description & Responsibilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Skills Matrix Grid</strong></td>
                        <td><code>matrix</code></td>
                        <td>—</td>
                        <td>Primary operational evaluation grid mapping developers against skills with 5-star rating widgets, 7 filter dimensions, column resizing, and gap indicators.</td>
                      </tr>
                      <tr>
                        <td><strong>Team Members</strong></td>
                        <td><code>developers</code></td>
                        <td><code>(N) Members</code></td>
                        <td>Personnel roster directory, profile attributes (Role, Email, SSO ID, Manager details), side profile modal, and CSV Import/Export engine.</td>
                      </tr>
                      <tr>
                        <td><strong>Tracked Skills</strong></td>
                        <td><code>skills</code></td>
                        <td><code>(N) Skills</code></td>
                        <td>Master technical catalog, vendor management, live average star ratings, proficient developer counts, and skill CRUD operations.</td>
                      </tr>
                      <tr>
                        <td><strong>Categories</strong></td>
                        <td><code>categories</code></td>
                        <td><code>(N) Categories</code></td>
                        <td>High-level taxonomy domain management (Frontend, Backend, Database, DevOps, Design, Other) grouping competencies.</td>
                      </tr>
                      <tr>
                        <td><strong>Teams</strong></td>
                        <td><code>teams</code></td>
                        <td><code>(N) Teams</code></td>
                        <td>Operational team administration, target required skill profiles, roster placement, and capability gap analysis.</td>
                      </tr>
                      <tr>
                        <td><strong>User Guide & Docs</strong></td>
                        <td><code>docs</code></td>
                        <td>Specs Portal</td>
                        <td>Comprehensive technical manual, Star Schema specifications, SCD Type 2 audit model documentation, and 1-click Word/Markdown/PDF export toolbar.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>🌟 Core Features & Tab-by-Tab Guide</h2>
                
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 1: 📊 Skills Matrix Grid (<code>matrix</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Interactive 5-Star Rating Widget</strong>: Click 1–5 stars to set proficiency; click active rating again or click <strong>✕ (reset)</strong> to clear to 0 stars (None). Level tooltips describe criteria from 0 (None) to 5 (Expert).</li>
                  <li><strong>Multi-Facet Filter Engine</strong>: Slices matrix across 7 dimensions (Team, Member, Skill, Category, Vendor, Level 0-5, and Text Search Query).</li>
                  <li><strong>Column Width Resizing & Sorting</strong>: Drag resize handle on column headers to adjust width; sort developers (A-Z / Z-A).</li>
                  <li><strong>Target Skill Gap Context</strong>: Visual badges highlight required team skills and capability gaps.</li>
                  <li><strong>Inline Skill Addition</strong>: Quick-create new skills directly from the matrix.</li>
                </ul>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 2: 👥 Team Members (Developers) Management (<code>developers</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Personnel Profile Attributes</strong>: Full Name, Role Title, Email, Team Assignment, SSO Company Login ID, Manager Full Name & Manager Login ID.</li>
                  <li><strong>Roster CRUD & Controls</strong>: Add Member form, inline row editing, safe deletion, and multi-select filtering by Team and Role.</li>
                  <li><strong>Interactive Profile Side Modal</strong>: Pop-over panel detailing member contact info, manager hierarchy, and complete rated skills breakdown.</li>
                  <li><strong>Smart CSV Engine</strong>: 1-click CSV Export and Smart CSV Import with auto-delimiter detection (<code>,</code>, <code>;</code>, <code>\t</code>), UTF-8 BOM stripping, header auto-mapping, and resilient DB constraint fallback execution.</li>
                </ul>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 3: 📚 Tracked Skills Inventory (<code>skills</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Catalog Attributes & Live Metrics</strong>: Skill Name, Domain Category, Vendor, Description, Live Average Star Rating, and Proficient Developer Count.</li>
                  <li><strong>Skill Catalog CRUD</strong>: Add, edit, or delete catalog skills with cascading database cleanups.</li>
                  <li><strong>Category Hyperlinks</strong>: Click category badges to jump directly to filtered taxonomy views.</li>
                </ul>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 4: 🏷️ Skill Categories Taxonomy (<code>categories</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Domain Taxonomy Structure</strong>: Pre-configured defaults (Frontend, Backend, Database, DevOps, Design, Other) and custom domain groups.</li>
                  <li><strong>Taxonomy Metrics & CRUD</strong>: Displays live skill count per domain; add, edit, or delete categories safely.</li>
                </ul>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 5: 🏢 Teams Governance & Skill Requirements (<code>teams</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Team Administration</strong>: Create, edit, and delete operational teams with member count and target skill count summaries.</li>
                  <li><strong>Expanded Team Drawer View</strong>: Assign required skills, <em>"Add Skill on the fly"</em>, assign roster developers, <em>"Add Member on the fly"</em>, unassign members, and line item collapse controls (<code>[✕] Close Line Item</code>).</li>
                </ul>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '1.25rem' }}>Tab 6: 📖 User Guide & System Specifications (<code>docs</code>)</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Interactive Export Toolbar</strong>: 1-click export to Word (<code>.doc</code>), raw Markdown (<code>.md</code>), or PDF print format.</li>
                  <li><strong>System Architecture & Specs</strong>: Complete Star Schema database specs, SCD Type 2 audit model, Supabase vs Demo connection modes, 5-star rating matrix, and workflows.</li>
                </ul>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>📖 Step-by-Step User Workflows</h2>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                  <li><strong>Workflow 1: Initializing the System</strong> — Launch app in Demo Mode or copy SQL script into Supabase SQL Editor.</li>
                  <li><strong>Workflow 2: Onboarding Team Members via CSV</strong> — Export roster template, prepare CSV, and upload via smart CSV import.</li>
                  <li><strong>Workflow 3: Defining Team Skill Requirements</strong> — Expand team rows and assign target required skills.</li>
                  <li><strong>Workflow 4: Assessing Team Proficiency & Preserving History</strong> — Rate skills using 5 stars in matrix grid to auto-update active ratings and record past entries with <code>is_current = false</code>.</li>
                </ul>

                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '2rem' }}>🛠️ File Structure Reference</h2>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', color: '#f8fafc', overflowX: 'auto', fontSize: '0.85rem', margin: '1rem 0' }}>
{`SkillsMatrix/
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
        └── supabaseClient.js # Supabase client initialization & env config`}
                </pre>
              </div>
            </div>
          )}

</main>
      </div>

            {/* Timeline Chart Modal */}
      {timelineData && timelineContext && (
        <div className="modal-overlay" onClick={() => setTimelineData(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Skill Timeline History</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{timelineContext.personName}</span> 
                  {' — '} 
                  <span style={{ fontWeight: 600 }}>{timelineContext.skillName}</span>
                </div>
              </div>
              <button 
                onClick={() => setTimelineData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
              {timelineData.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No historical data available for this skill.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      ticks={[0, 1, 2, 3, 4, 5]} 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                      labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                      formatter={(value) => [`${value} Star${value !== 1 ? 's' : ''}`, 'Level']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="level" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0f172a' }} 
                      activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Member Details Modal */}
      {selectedDevInfo && (
        <div className="modal-overlay" onClick={() => setSelectedDevInfo(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Team Member Details</h3>
              <button 
                onClick={() => setSelectedDevInfo(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Full Name</label>
                <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{selectedDevInfo.name}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Role / Title</label>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedDevInfo.role}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Team</label>
                <div>
                  <span className="badge empty" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)', pointerEvents: 'none', marginTop: '0.15rem' }}>
                    {selectedDevInfo.team || 'No Team'}
                  </span>
                </div>
              </div>
              {selectedDevInfo.email && (
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Email</label>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedDevInfo.email}</div>
                </div>
              )}
              {selectedDevInfo.companyLoginId && (
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Company Login ID</label>
                  <code style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    {selectedDevInfo.companyLoginId}
                  </code>
                </div>
              )}
              {(selectedDevInfo.managerName || selectedDevInfo.managerCompanyLoginId) && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Reports To</label>
                  {selectedDevInfo.managerName && (
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedDevInfo.managerName}</div>
                  )}
                  {selectedDevInfo.managerCompanyLoginId && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {selectedDevInfo.managerCompanyLoginId}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
