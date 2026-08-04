import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
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
  Upload
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

const SQL_SETUP_SCRIPT = `-- 1. Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  vendor TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create developer_skills join table
CREATE TABLE IF NOT EXISTS developer_skills (
  developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('Basic', 'Emerging', 'Competent', 'Strong', 'Expert')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (developer_id, skill_id)
);

-- 3b. Create team_skills join table
CREATE TABLE IF NOT EXISTS team_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true NOT NULL,
  is_current BOOLEAN DEFAULT true NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_skills ENABLE ROW LEVEL SECURITY;

-- 5. Create policies to allow public read/write (for this demo app)
CREATE POLICY "Allow public read developers" ON developers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert developers" ON developers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update developers" ON developers FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete developers" ON developers FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read skills" ON skills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert skills" ON skills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update skills" ON skills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete skills" ON skills FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read developer_skills" ON developer_skills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert developer_skills" ON developer_skills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update developer_skills" ON developer_skills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete developer_skills" ON developer_skills FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read team_skills" ON team_skills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert team_skills" ON team_skills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update team_skills" ON team_skills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete team_skills" ON team_skills FOR DELETE TO public USING (true);

-- 6. Insert some sample seed data
INSERT INTO developers (name, role) VALUES
  ('Sarah Connor', 'Frontend Architect'),
  ('John Doe', 'Backend Developer'),
  ('Ada Lovelace', 'Lead Systems Engineer'),
  ('Bruce Wayne', 'DevOps Specialist')
ON CONFLICT DO NOTHING;

INSERT INTO skills (name, category) VALUES
  ('React', 'Frontend'),
  ('Node.js', 'Backend'),
  ('PostgreSQL', 'Database'),
  ('Docker', 'DevOps'),
  ('CSS Grid & Flexbox', 'Frontend')
ON CONFLICT DO NOTHING;`;

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
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
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
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('All');
  const [selectedDevFilter, setSelectedDevFilter] = useState('All');
  const [selectedSkillIds, setSelectedSkillIds] = useState([]); // Array of skill IDs for multi-select
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [devListSortOrder, setDevListSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [skillsSortOrder, setSkillsSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [categoriesSortOrder, setCategoriesSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [teamsSortOrder, setTeamsSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedDevInfo, setSelectedDevInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [newDevName, setNewDevName] = useState('');
  const [newDevRole, setNewDevRole] = useState('');
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
        team: assignedTeamName,
        teamId: assignedTeamId
      };
      setDevelopers([...developers, newDev]);
      setNewDevName('');
      setNewDevRole('');
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
      const { data, error } = await supabase
        .from('person')
        .insert([{ 
          full_name: newDevName, 
          role_title: newDevRole,
          manager_fullname: newDevManagerName || null,
          manager_company_login_id: newDevManagerCompanyLoginId || null,
          company_login_id: newDevCompanyLoginId || null
        }])
        .select();

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
      setNewDevManagerName('');
      setNewDevManagerCompanyLoginId('');
      setNewDevCompanyLoginId('');
      setNewDevTeamId('');
      
      // Auto-navigate back to Matrix and set filters
      setActiveTab('matrix');
      setSelectedTeamFilter(assignedTeamName);
      setSelectedDevFilter(newDevMapped.id);
      
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

    const headers = ['Full Name', 'Role', 'Team', 'Company Login ID', 'Manager Full Name', 'Manager Company Login ID'];
    const csvRows = [headers.join(',')];

    developers.forEach(dev => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      const row = [
        escape(dev.name),
        escape(dev.role),
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

  // Helper to parse CSV text lines accounting for quoted values
  const parseCSVLine = (textLine) => {
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
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
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
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row.');
        }

        const headerTokens = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Match header column indexes flexible to variations
        const findIdx = (keywords) => headerTokens.findIndex(h => keywords.some(k => h.includes(k)));

        const nameIdx = findIdx(['fullname', 'name', 'developername', 'membername']);
        const roleIdx = findIdx(['role', 'title', 'roletitle']);
        const teamIdx = findIdx(['team', 'teamname']);
        const companyLoginIdx = findIdx(['companyloginid', 'companylogin', 'loginid', 'login']);
        const mgrNameIdx = findIdx(['managerfullname', 'managername', 'manager']);
        const mgrLoginIdx = findIdx(['managercompanyloginid', 'managerlogin', 'managercompanylogin']);

        if (nameIdx === -1) {
          throw new Error('CSV missing required "Full Name" column.');
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const fullName = cols[nameIdx];
          if (!fullName) continue;

          const roleTitle = (roleIdx !== -1 && cols[roleIdx]) ? cols[roleIdx] : 'Software Engineer';
          const teamNameRaw = (teamIdx !== -1 && cols[teamIdx]) ? cols[teamIdx] : '';
          const companyLoginId = (companyLoginIdx !== -1 && cols[companyLoginIdx]) ? cols[companyLoginIdx] : null;
          const managerName = (mgrNameIdx !== -1 && cols[mgrNameIdx]) ? cols[mgrNameIdx] : null;
          const managerLoginId = (mgrLoginIdx !== -1 && cols[mgrLoginIdx]) ? cols[mgrLoginIdx] : null;

          // Find team match if provided
          const matchedTeam = teamNameRaw 
            ? teams.find(t => t.name.toLowerCase() === teamNameRaw.toLowerCase()) 
            : null;

          if (useDemoMode) {
            const newDev = {
              id: `dev-imp-${Date.now()}-${i}`,
              name: fullName,
              role: roleTitle,
              team: matchedTeam ? matchedTeam.name : (teamNameRaw || 'No Team'),
              teamId: matchedTeam ? matchedTeam.id : null,
              companyLoginId,
              managerName,
              managerCompanyLoginId: managerLoginId
            };
            setDevelopers(prev => [...prev, newDev]);
            importedCount++;
          } else {
            const { data, error } = await supabase
              .from('person')
              .insert([{
                full_name: fullName,
                role_title: roleTitle,
                company_login_id: companyLoginId,
                manager_fullname: managerName,
                manager_company_login_id: managerLoginId
              }])
              .select();

            if (error) {
              console.error(`Error importing row ${i}:`, error);
              continue;
            }

            const insertedPerson = data[0];
            let assignedTeamName = 'No Team';
            let assignedTeamId = null;

            if (matchedTeam) {
              await supabase
                .from('person_teams')
                .insert([{
                  person_id: insertedPerson.id,
                  team_id: matchedTeam.id,
                  is_current: true,
                  valid_from: todayStr
                }]);
              assignedTeamName = matchedTeam.name;
              assignedTeamId = matchedTeam.id;
            }

            setDevelopers(prev => [...prev, {
              id: insertedPerson.id,
              name: insertedPerson.full_name,
              role: insertedPerson.role_title || roleTitle,
              email: insertedPerson.email,
              team: assignedTeamName,
              teamId: assignedTeamId,
              managerName: insertedPerson.manager_fullname,
              managerCompanyLoginId: insertedPerson.manager_company_login_id,
              companyLoginId: insertedPerson.company_login_id
            }]);
            importedCount++;
          }
        }

        showToast(`Successfully imported ${importedCount} team members!`);
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
        managerCompanyLoginId: editDevManagerCompanyLoginId
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
        setSelectedTeamFilter(newTeam.name);
        setSelectedDevFilter('All');
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
        setSelectedTeamFilter(addedTeamName);
        setSelectedDevFilter('All');
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
      if (selectedTeamFilter === name) {
        setSelectedTeamFilter('All');
      }
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
      if (selectedTeamFilter === name) {
        setSelectedTeamFilter('All');
      }
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

  // Helper to retrieve the current proficiency level star rating
  const getProficiencyBadge = (devId, skillId) => {
    const record = developerSkills.find(
      (ds) => ds.developer_id === devId && ds.skill_id === skillId
    );
    
    const level = record ? record.level : 'None';
    
    return (
      <StarRating
        value={level}
        onChange={(targetLevel) => handleSetSkillLevel(devId, skillId, targetLevel)}
        disabled={loading}
      />
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                    <div style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Team
                      </label>
                      <select
                        className="form-select"
                        value={selectedTeamFilter}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_TEAM') {
                            setTeamRedirectTarget('matrix');
                            setActiveTab('teams');
                            setSelectedTeamFilter('All');
                          } else {
                            setSelectedTeamFilter(e.target.value);
                            setSelectedDevFilter('All');
                          }
                        }}
                        style={{ height: '42px', padding: '0.5rem 1rem' }}
                      >
                        <option value="All">All Teams</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                        <option value="No Team">No Team</option>
                        <option disabled>— Actions —</option>
                        <option value="ADD_TEAM">+ Add New Team...</option>
                      </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Team Member
                      </label>
                      <select
                        className="form-select"
                        value={selectedDevFilter}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_DEV') {
                            setActiveTab('developers');
                            setSelectedDevFilter('All');
                          } else {
                            setSelectedDevFilter(e.target.value);
                          }
                        }}
                        style={{ height: '42px', padding: '0.5rem 1rem' }}
                      >
                        <option value="All">All Members</option>
                        {developers
                          .filter(dev => selectedTeamFilter === 'All' || dev.team === selectedTeamFilter)
                          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                          .map((dev) => (
                            <option key={dev.id} value={dev.id}>{dev.name}</option>
                          ))}
                        <option disabled>— Actions —</option>
                        <option value="ADD_DEV">+ Add New Member...</option>
                      </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Filter by Skill ({selectedSkillIds.length === 0 ? 'All' : `${selectedSkillIds.length} selected`})
                      </label>

                      {/* Custom Multi-select Dropdown Button */}
                      <button
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

                      {/* Dropdown Menu Overlay */}
                      {isSkillDropdownOpen && (
                        <>
                          {/* Backdrop to close dropdown on click outside */}
                          <div 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                            onClick={() => setIsSkillDropdownOpen(false)} 
                          />
                          <div
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
                              padding: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.4rem' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setSelectedSkillIds([])}
                              >
                                Select All (Reset)
                              </button>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                onClick={() => setIsSkillDropdownOpen(false)}
                              >
                                Done
                              </button>
                            </div>

                            {skills
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((sk) => {
                                const isChecked = selectedSkillIds.includes(String(sk.id));
                                return (
                                  <label
                                    key={sk.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.4rem 0.5rem',
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
                                      onChange={(e) => {
                                        const skIdStr = String(sk.id);
                                        if (e.target.checked) {
                                          setSelectedSkillIds([...selectedSkillIds, skIdStr]);
                                        } else {
                                          setSelectedSkillIds(selectedSkillIds.filter(id => id !== skIdStr));
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
                        </>
                      )}
                    </div>
                    
                    {(selectedTeamFilter !== 'All' || selectedDevFilter !== 'All' || selectedSkillIds.length > 0) && (
                      <div style={{ display: 'flex' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ height: '42px', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', margin: 0 }}
                          onClick={() => {
                            setSelectedTeamFilter('All');
                            setSelectedDevFilter('All');
                            setSelectedSkillIds([]);
                          }}
                        >
                          <X size={16} />
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="matrix-container">
                    <table className="matrix-table">
                      {(() => {
                        // Determine skills to show in columns based on selected team filter & selected skill checkboxes
                        const targetTeamObj = selectedTeamFilter !== 'All' && selectedTeamFilter !== 'No Team'
                          ? teams.find(t => t.name === selectedTeamFilter)
                          : null;
                        
                        const teamAssignedSkillIds = targetTeamObj
                          ? teamSkills.filter(ts => ts.team_id === targetTeamObj.id && ts.is_current !== false && ts.is_required !== false).map(ts => ts.skill_id)
                          : [];

                        let displayedSkills = targetTeamObj
                          ? skills.filter(s => teamAssignedSkillIds.includes(s.id))
                          : skills;

                        if (selectedSkillIds.length > 0) {
                          displayedSkills = displayedSkills.filter(s => selectedSkillIds.includes(String(s.id)));
                        }

                        const filteredDevs = [...developers]
                          .filter((dev) => {
                            const matchesTeam = selectedTeamFilter === 'All' || dev.team === selectedTeamFilter;
                            const matchesDev = selectedDevFilter === 'All' || String(dev.id) === String(selectedDevFilter);
                            return matchesTeam && matchesDev;
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
                                  style={{ cursor: 'pointer', userSelect: 'none' }}
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
                                </th>
                                {displayedSkills.length === 0 ? (
                                  <th style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--text-muted)' }}>
                                    No skills assigned to team
                                  </th>
                                ) : (
                                  displayedSkills.map((skill) => (
                                    <th key={skill.id} title={`${skill.name} (${skill.category})`}>
                                      {skill.name}
                                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, opacity: 0.6 }}>{skill.category}</span>
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
                                          setSelectedTeamFilter('All');
                                          setSelectedDevFilter('All');
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
                                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>No skills assigned to team "{selectedTeamFilter}".</span>
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
                                    <td>
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
                                      <td key={skill.id}>
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
                          style={{ width: '22%', cursor: 'pointer', userSelect: 'none' }}
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
                        </th>
                        <th style={{ width: '20%' }}>Role</th>
                        <th style={{ width: '15%' }}>Team</th>
                        <th style={{ width: '12%' }}>Login ID</th>
                        <th style={{ width: '18%' }}>Manager</th>
                        <th style={{ width: '13%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...developers]
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
                            <td>
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
                            <td>
                              <input 
                                type="text" 
                                className="form-input compact-input" 
                                placeholder="Role/Title"
                                value={editDevRole}
                                onChange={(e) => setEditDevRole(e.target.value)}
                                required
                              />
                            </td>
                            <td>
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
                            <td>
                              <input 
                                type="text" 
                                className="form-input compact-input" 
                                placeholder="Login ID"
                                value={editDevCompanyLoginId}
                                onChange={(e) => setEditDevCompanyLoginId(e.target.value)}
                              />
                            </td>
                            <td>
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
                            <td>
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
                            <td>
                              <div style={{ fontWeight: 600 }}>{dev.name}</div>
                              {dev.email && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {dev.email}
                                </div>
                              )}
                            </td>
                            <td>{dev.role}</td>
                            <td>
                              <span className="badge empty" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', border: '1px solid var(--border-color)', pointerEvents: 'none' }}>
                                {dev.team}
                              </span>
                            </td>
                            <td>
                              <code>{dev.companyLoginId || '—'}</code>
                            </td>
                            <td>
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
                            <td>
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Tracked Skills List</h3>
              
              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0, width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Vendor</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Microsoft" 
                    value={newSkillVendor}
                    onChange={(e) => setNewSkillVendor(e.target.value)}
                  />
                </div>
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
                  <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Strongly typed language" 
                    value={newSkillDescription}
                    onChange={(e) => setNewSkillDescription(e.target.value)}
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
                <button type="submit" className="btn-primary" style={{ height: '42px', width: '100%' }} disabled={loading}>
                  <Plus size={16} />
                  Add Skill
                </button>
              </form>

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
                        <th style={{ width: '15%' }}>Vendor</th>
                        <th 
                          onClick={() => setSkillsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ width: '25%', cursor: 'pointer', userSelect: 'none' }}
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
                        </th>
                        <th style={{ width: '20%' }}>Category</th>
                        <th style={{ width: '27%' }}>Description</th>
                        <th style={{ width: '13%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...skills]
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
                              <td>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Vendor"
                                  value={editSkillVendor}
                                  onChange={(e) => setEditSkillVendor(e.target.value)}
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Skill Name"
                                  value={editSkillName}
                                  onChange={(e) => setEditSkillName(e.target.value)}
                                  required
                                />
                              </td>
                              <td>
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
                              <td>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Description"
                                  value={editSkillDescription}
                                  onChange={(e) => setEditSkillDescription(e.target.value)}
                                />
                              </td>
                              <td>
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
                              <td>
                                {skill.vendor ? (
                                  <span className="badge" style={{ 
                                    fontSize: '0.75rem', 
                                    background: 'rgba(96, 165, 250, 0.1)', 
                                    color: '#60a5fa',
                                    border: '1px solid rgba(96, 165, 250, 0.25)',
                                    padding: '0.1rem 0.4rem', 
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    pointerEvents: 'none'
                                  }}>
                                    {skill.vendor}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{skill.name}</div>
                              </td>
                              <td>
                                <span className="badge empty" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', border: '1px solid var(--border-color)', pointerEvents: 'none' }}>
                                  {skill.category}
                                </span>
                              </td>
                              <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {skill.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td>
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Manage Categories</h3>
              
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
                          style={{ width: '30%', cursor: 'pointer', userSelect: 'none' }}
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
                        </th>
                        <th style={{ width: '57%' }}>Description</th>
                        <th style={{ width: '13%' }}>Actions</th>
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
                              <td>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Category Name"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-input compact-input" 
                                  placeholder="Description"
                                  value={editCategoryDesc}
                                  onChange={(e) => setEditCategoryDesc(e.target.value)}
                                />
                              </td>
                              <td>
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
                              <td>
                                <div style={{ fontWeight: 600 }}>{cat.name}</div>
                              </td>
                              <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {cat.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td>
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Teams Management</h3>
              
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
                          style={{ width: '30%', cursor: 'pointer', userSelect: 'none' }}
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
                        </th>
                        <th style={{ width: '30%' }}>Description</th>
                        <th style={{ width: '15%' }}>Members</th>
                        <th style={{ width: '25%' }}>Assigned Skills</th>
                        <th style={{ width: '10%' }}>Actions</th>
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
                                  <td>
                                    <input 
                                      type="text" 
                                      className="form-input compact-input" 
                                      placeholder="Team Name"
                                      value={editTeamName}
                                      onChange={(e) => setEditTeamName(e.target.value)}
                                      required
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="text" 
                                      className="form-input compact-input" 
                                      placeholder="Description"
                                      value={editTeamDesc}
                                      onChange={(e) => setEditTeamDesc(e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      {assignedSkills.length} {assignedSkills.length === 1 ? 'skill' : 'skills'}
                                    </span>
                                  </td>
                                  <td>
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
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{team.name}</div>
                                    </td>
                                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {team.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td>
                                      <button 
                                        className="badge empty" 
                                        style={{ 
                                          fontSize: '0.75rem', 
                                          padding: '0.1rem 0.4rem',
                                          cursor: 'pointer',
                                          userSelect: 'none',
                                          border: expandedTeamId === team.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                          background: expandedTeamId === team.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                          color: expandedTeamId === team.id ? 'var(--text-primary)' : 'var(--text-muted)'
                                        }}
                                        onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                        title="Click to view team details & manage skills"
                                      >
                                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                      </button>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                                        {assignedSkills.length === 0 ? (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None assigned</span>
                                        ) : (
                                          assignedSkills.slice(0, 3).map(sk => (
                                            <span key={sk.id} className="badge level-competent" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                                              {sk.name}
                                            </span>
                                          ))
                                        )}
                                        {assignedSkills.length > 3 && (
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            +{assignedSkills.length - 3} more
                                          </span>
                                        )}
                                        <button 
                                          className="btn-secondary" 
                                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', height: '22px', marginLeft: '0.25rem', width: 'auto' }}
                                          onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                        >
                                          Manage
                                        </button>
                                      </div>
                                    </td>
                                    <td>
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
                                    <tr style={{ background: 'rgba(15, 23, 42, 0.2)' }}>
                                      <td colSpan={5} style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                          {/* Left Box: Team Members */}
                                          <div style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.25rem' }}>
                                              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Team Members</h5>
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({memberCount})</span>
                                            </div>
                                            {developers.filter(d => d.teamId === team.id).length === 0 ? (
                                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                No members in this team.
                                              </div>
                                            ) : (
                                              developers.filter(d => d.teamId === team.id).map(dev => (
                                                <div key={dev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{dev.name}</span>
                                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{dev.role}</span>
                                                </div>
                                              ))
                                            )}
                                          </div>

                                          {/* Right Box: Team Assigned Skills */}
                                          <div style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.25rem' }}>
                                              <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Team Skills</h5>
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({assignedSkills.length})</span>
                                            </div>

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                              Click skills to assign or remove them from <strong>{team.name}</strong>:
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
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
        </main>
      </div>

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
