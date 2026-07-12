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
  Trash2
} from 'lucide-react';

// Predefined mock data for Demo Mode
const mockDevelopers = [
  { id: 'dev-1', name: 'Sarah Connor', role: 'Frontend Architect' },
  { id: 'dev-2', name: 'John Doe', role: 'Backend Developer' },
  { id: 'dev-3', name: 'Ada Lovelace', role: 'Lead Systems Engineer' },
  { id: 'dev-4', name: 'Bruce Wayne', role: 'DevOps Specialist' }
];

const mockSkills = [
  { id: 'skill-1', name: 'React', category: 'Frontend', category_id: 1 },
  { id: 'skill-2', name: 'Node.js', category: 'Backend', category_id: 2 },
  { id: 'skill-3', name: 'PostgreSQL', category: 'Database', category_id: 3 },
  { id: 'skill-4', name: 'Docker', category: 'DevOps', category_id: 4 },
  { id: 'skill-5', name: 'CSS Grid & Flexbox', category: 'Frontend', category_id: 1 }
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
  category TEXT NOT NULL,
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_skills ENABLE ROW LEVEL SECURITY;

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
  const [categories, setCategories] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('matrix'); // matrix, developers, skills
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [newDevName, setNewDevName] = useState('');
  const [newDevRole, setNewDevRole] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
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

  // Skills CRUD states
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editSkillName, setEditSkillName] = useState('');
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
          category_id: row.category_id
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
      const newDev = {
        id: `dev-${Date.now()}`,
        name: newDevName,
        role: newDevRole
      };
      setDevelopers([...developers, newDev]);
      setNewDevName('');
      setNewDevRole('');
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
      showToast(`Successfully added team member: ${newDevName}`);
    } catch (err) {
      console.error(err);
      showToast(`Error adding team member: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
        category: catObj ? catObj.name : 'Other',
        category_id: parseInt(newSkillCategoryId)
      };
      setSkills([...skills, newSkill]);
      setNewSkillName('');
      showToast(`Added skill: ${newSkillName} (Demo)`);
      setLoading(false);
      return;
    }

    try {
      const catId = parseInt(newSkillCategoryId);
      const { data: skillData, error: skillError } = await supabase
        .from('skills')
        .insert([{ name: newSkillName, category_id: catId }])
        .select();

      if (skillError) throw skillError;

      const catObj = categories.find(c => c.id === catId);
      const newSkillMapped = {
        id: skillData[0].id,
        name: skillData[0].name,
        category: catObj ? catObj.name : 'Other',
        category_id: skillData[0].category_id
      };

      setSkills([...skills, newSkillMapped]);
      setNewSkillName('');
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
          updated_at: new Date().toISOString()
        })
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.map(s => s.id === skillId ? { 
        ...s, 
        name: editSkillName, 
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

      setCategories([...categories, data[0]]);
      setNewCategoryName('');
      setNewCategoryDesc('');
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

      setTeams([...teams, data[0]]);
      setNewTeamName('');
      setNewTeamDesc('');
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
      showToast(`Successfully removed team: ${name}`);
    } catch (err) {
      console.error(err);
      showToast(`Error deleting team: ${err.message}`);
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

  // Helper to retrieve the current proficiency level select dropdown
  const getProficiencyBadge = (devId, skillId) => {
    const record = developerSkills.find(
      (ds) => ds.developer_id === devId && ds.skill_id === skillId
    );
    
    const level = record ? record.level : 'None';
    const classLevel = level === 'None' ? 'empty' : level.toLowerCase();
    
    return (
      <select
        className={`badge ${classLevel}`}
        value={level}
        onChange={(e) => handleSetSkillLevel(devId, skillId, e.target.value)}
        disabled={loading}
        title="Select competency level"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          textAlign: 'center',
          textAlignLast: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          paddingRight: '0.65rem',
          paddingLeft: '0.65rem',
          height: '32px',
          width: '120px'
        }}
      >
        <option value="None" style={{ background: '#1e293b', color: 'var(--text-muted)' }}>0 – None</option>
        <option value="Basic" style={{ background: '#1e293b', color: 'var(--color-basic)' }}>1 – Basic</option>
        <option value="Emerging" style={{ background: '#1e293b', color: 'var(--color-emerging)' }}>2 – Emerging</option>
        <option value="Competent" style={{ background: '#1e293b', color: 'var(--color-competent)' }}>3 – Competent</option>
        <option value="Strong" style={{ background: '#1e293b', color: 'var(--color-strong)' }}>4 – Strong</option>
        <option value="Expert" style={{ background: '#1e293b', color: 'var(--color-expert)' }}>5 – Expert</option>
      </select>
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

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Team Competency Matrix</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Interactive grid view mapping team skills. Click on any badge to cycle through proficiencies: <strong>0 – None → 1 – Basic → 2 – Emerging → 3 – Competent → 4 – Strong → 5 – Expert</strong>.
              </p>

              {developers.length === 0 || skills.length === 0 ? (
                <div className="empty-state">
                  <LayoutGrid size={48} />
                  <p>No team members or skills tracked yet. Use the sidebar on the left to add skills and members.</p>
                </div>
              ) : (
                <div className="matrix-container">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Team Member</th>
                        {skills.map((skill) => (
                          <th key={skill.id} title={`${skill.name} (${skill.category})`}>
                            {skill.name}
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, opacity: 0.6 }}>{skill.category}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {developers.map((dev) => (
                        <tr key={dev.id}>
                          <td>
                            <div className="dev-name">{dev.name}</div>
                            <div className="dev-role">
                              {dev.role} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({dev.team})</span>
                            </div>
                          </td>
                          {skills.map((skill) => (
                            <td key={skill.id}>
                              {getProficiencyBadge(dev.id, skill.id)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Team Members List */}
          {activeTab === 'developers' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Team Members List</h3>
              
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
                    onChange={(e) => setNewDevTeamId(e.target.value)}
                  >
                    <option value="">No Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {developers.map((dev) => (
                    editingDevId === dev.id ? (
                      <div 
                        key={dev.id} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '0.75rem',
                          padding: '1.25rem',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: '10px'
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevName}
                              onChange={(e) => setEditDevName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Role</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevRole}
                              onChange={(e) => setEditDevRole(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Company Login ID</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevCompanyLoginId}
                              placeholder="Optional"
                              onChange={(e) => setEditDevCompanyLoginId(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Email</label>
                            <input 
                              type="email" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevEmail}
                              placeholder="Optional"
                              onChange={(e) => setEditDevEmail(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Manager Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevManagerName}
                              placeholder="Optional"
                              onChange={(e) => setEditDevManagerName(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Manager Login ID</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              value={editDevManagerCompanyLoginId}
                              placeholder="Optional"
                              onChange={(e) => setEditDevManagerCompanyLoginId(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Team</label>
                            <select 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', height: 'auto' }}
                              value={editDevTeamId}
                              onChange={(e) => setEditDevTeamId(e.target.value)}
                            >
                              <option value="">No Team</option>
                              {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => setEditingDevId(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => handleUpdateDeveloper(dev.id)}
                            disabled={loading}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        key={dev.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '1rem 1.25rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {dev.name}
                            {dev.email && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                ({dev.email})
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {dev.role}
                            <span className="badge empty" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', border: '1px solid var(--border-color)', pointerEvents: 'none' }}>
                              {dev.team}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            {dev.companyLoginId && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Login ID: <strong>{dev.companyLoginId}</strong>
                              </span>
                            )}
                            {(dev.managerName || dev.managerCompanyLoginId) && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Manager: {dev.managerName || '—'} {dev.managerCompanyLoginId ? `(ID: ${dev.managerCompanyLoginId})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ID: {String(dev.id).substring(0, 8)}
                          </span>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
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
                                padding: '0.35rem 0.75rem', 
                                fontSize: '0.8rem', 
                                width: 'auto',
                                borderColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444'
                              }}
                              onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
                              disabled={loading}
                            >
                              <Trash2 size={12} style={{ marginRight: '2px', verticalAlign: 'middle' }} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
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
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Skill Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. TypeScript" 
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Category</label>
                  <select 
                    className="form-select"
                    style={{ height: '42px' }}
                    value={newSkillCategoryId}
                    onChange={(e) => setNewSkillCategoryId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ height: '42px' }} disabled={loading}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {skills.map((skill) => (
                    editingSkillId === skill.id ? (
                      <div 
                        key={skill.id} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '0.75rem',
                          padding: '1.25rem',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: '10px'
                        }}
                      >
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Skill Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.5rem 0.75rem' }}
                            value={editSkillName}
                            onChange={(e) => setEditSkillName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Category</label>
                          <select 
                            className="form-input"
                            style={{ padding: '0.5rem 0.75rem', height: 'auto' }}
                            value={editSkillCategoryId}
                            onChange={(e) => setEditSkillCategoryId(e.target.value)}
                            required
                          >
                            <option value="" disabled>Select Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => setEditingSkillId(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => handleUpdateSkill(skill.id)}
                            disabled={loading}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        key={skill.id} 
                        style={{ 
                          padding: '1.25rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{skill.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category: {skill.category}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => {
                              setEditingSkillId(skill.id);
                              setEditSkillName(skill.name);
                              setEditSkillCategoryId(skill.category_id || '');
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
                              borderColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444'
                            }}
                            onClick={() => handleDeleteSkill(skill.id, skill.name)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {categories.map((cat) => (
                    editingCategoryId === cat.id ? (
                      <div 
                        key={cat.id} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '0.75rem',
                          padding: '1.25rem',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: '10px'
                        }}
                      >
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Category Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.5rem 0.75rem' }}
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Description</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.5rem 0.75rem' }}
                            value={editCategoryDesc}
                            placeholder="Description (Optional)"
                            onChange={(e) => setEditCategoryDesc(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => setEditingCategoryId(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                            onClick={() => handleUpdateCategory(cat.id)}
                            disabled={loading}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        key={cat.id} 
                        style={{ 
                          padding: '1.25rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{cat.name}</span>
                          {cat.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>{cat.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
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
                              borderColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444'
                            }}
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {teams.map((team) => {
                    const memberCount = developers.filter(d => d.teamId === team.id).length;
                    return (
                      editingTeamId === team.id ? (
                        <div 
                          key={team.id} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '0.75rem',
                            padding: '1.25rem',
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '10px'
                          }}
                        >
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Team Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem' }}
                              value={editTeamName}
                              onChange={(e) => setEditTeamName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Description</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '0.5rem 0.75rem' }}
                              value={editTeamDesc}
                              placeholder="Optional"
                              onChange={(e) => setEditTeamDesc(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                              onClick={() => setEditingTeamId(null)}
                            >
                              Cancel
                            </button>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                              onClick={() => handleUpdateTeam(team.id)}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          key={team.id} 
                          style={{ 
                            padding: '1.25rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{team.name}</span>
                              <span className="badge empty" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>
                                {memberCount} {memberCount === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                            {team.description && (
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{team.description}</p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
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
                                borderColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444'
                              }}
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
