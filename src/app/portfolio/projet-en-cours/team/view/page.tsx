"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setupAuthListener } from '@/utils/firebase-api';
import { 
  getProjectTeamMembers, 
  getProjectBySlug, 
  isUserMemberOfProject,
  type ProjectTeamMember 
} from '@/utils/projet-api';
import { User, FolderKanban, Shield } from 'lucide-react';
import Header from '@/components/app/Header/Header';
import Login from '@/components/app/Header/Login/Login';
import CardView from './navigation/CardView';
import DetailView from './navigation/DetailView';
import styles from './view.module.css';

// ─── Types ──────────────────────────────────────────────────────

export interface PhoneEntry {
  model: string;
  isPublic: boolean;
}

export interface ComputerEntry {
  os: 'windows' | 'mac' | 'linux';
  ram: string;
  storage: string;
  gpu?: string;
  isPublic: boolean;
}

// Ré-export du type depuis projet-api
export type { ProjectTeamMember } from '@/utils/projet-api';

export const rolesData: { name: string; colorClass: string }[] = [
  { name: 'Game Director', colorClass: 'Direction' },
  { name: 'Creative Director', colorClass: 'Direction' },
  { name: 'Technical Director', colorClass: 'Direction' },
  { name: 'Project Manager', colorClass: 'Direction' },
  { name: 'Team Coordinator', colorClass: 'Direction' },
  { name: 'Game Designer', colorClass: 'Design' },
  { name: 'Level Designer', colorClass: 'Design' },
  { name: 'Gameplay Designer', colorClass: 'Design' },
  { name: 'Narrative Designer', colorClass: 'Design' },
  { name: 'Game Programmer', colorClass: 'Programming' },
  { name: 'Engine Programmer', colorClass: 'Programming' },
  { name: 'AI Programmer', colorClass: 'Programming' },
  { name: 'UI Programmer', colorClass: 'Programming' },
  { name: '3D Artist', colorClass: 'Art3D' },
  { name: '3D Cinematic', colorClass: 'Art3D' },
  { name: 'Texture Artist', colorClass: 'Art3D' },
  { name: 'Prop Artist', colorClass: 'Art3D' },
  { name: 'Environment Artist', colorClass: 'Art3D' },
  { name: '3D Animator', colorClass: 'Art3D' },
  { name: 'Mocap Actor', colorClass: 'Art3D' },
  { name: '3D Art Support', colorClass: 'Art3D' },
  { name: 'Technical Artist', colorClass: 'Art3D' },
  { name: 'UX Designer', colorClass: 'UIUX' },
  { name: 'UI Designer', colorClass: 'UIUX' },
  { name: 'UI Artist', colorClass: 'UIUX' },
  { name: 'UI Art Support', colorClass: 'UIUX' },
  { name: 'Music Composer', colorClass: 'Audio' },
  { name: 'Sound Designer', colorClass: 'Audio' },
  { name: 'Voice Actor', colorClass: 'Audio' },
  { name: 'Voice Director', colorClass: 'Audio' },
  { name: 'Community Manager', colorClass: 'Support' },
  { name: 'Documentation Manager', colorClass: 'Support' },
  { name: 'Content Creator', colorClass: 'Support' },
  { name: 'Marketing Manager', colorClass: 'Support' },
  { name: 'QA Tester', colorClass: 'Support' },
];

export const getRoleColorClass = (roleName: string): string => {
  const role = rolesData.find((r) => r.name === roleName);
  return role ? role.colorClass : '';
};

// ─── Normalisation des données ─────────────────────────────────

const normalizeMemberData = (member: any): ProjectTeamMember => {
  const eq = member.equipment ?? {};

  // Résolution de l'internet global
  const internet: 'wifi' | 'mobile' | 'both' =
    eq.internet ?? eq.phone?.internet ?? 'wifi';

  // Téléphones
  let phones: PhoneEntry[] = [];
  if (eq.phones && Array.isArray(eq.phones) && eq.phones.length > 0) {
    phones = eq.phones.map((p: any) => ({
      model: p.model || '',
      isPublic: p.isPublic !== undefined ? p.isPublic : true,
    }));
  } else if (eq.phone?.model) {
    phones = [{ model: eq.phone.model, isPublic: eq.phone.isPublic !== undefined ? eq.phone.isPublic : true }];
  }

  // Ordinateurs
  let computers: ComputerEntry[] = [];
  if (eq.computers && Array.isArray(eq.computers) && eq.computers.length > 0) {
    computers = eq.computers.map((c: any) => ({
      os: c.os || 'windows',
      ram: c.ram || '',
      storage: c.storage || '',
      gpu: c.gpu || '',
      isPublic: c.isPublic !== undefined ? c.isPublic : true,
    }));
  } else if (eq.computer) {
    computers = [{
      os: eq.computer.os || 'windows',
      ram: eq.computer.ram || '',
      storage: eq.computer.storage || '',
      gpu: eq.computer.gpu || '',
      isPublic: eq.computer.isPublic !== undefined ? eq.computer.isPublic : true,
    }];
  }

  return {
    ...member,
    id: member.id || '',
    userId: member.userId || '',
    projectId: member.projectId || '',
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    age: member.age || 0,
    agePublic: member.agePublic !== undefined ? member.agePublic : true,
    email: member.email || '',
    phone: member.phone || '',
    image: member.image || '',
    skills: member.skills || '',
    skillsPublic: member.skillsPublic !== undefined ? member.skillsPublic : true,
    contacts: member.contacts || [],
    roles: member.roles || [],
    equipment: { internet, phones, computers },
    location: member.location || { country: '', city: '', district: '', districtPublic: true },
    createdAt: member.createdAt?.toDate
      ? member.createdAt.toDate()
      : new Date(member.createdAt || Date.now()),
    updatedAt: member.updatedAt?.toDate
      ? member.updatedAt.toDate()
      : new Date(member.updatedAt || Date.now()),
  };
};

// ─── Composant ──────────────────────────────────────────────────

function TeamViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');

  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isUserMember, setIsUserMember] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (user) => {
      if (user) setCurrentUser(user);
      if (projectSlug) await loadProjectFromSlug(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [projectSlug]);

  const loadProjectFromSlug = async (user: any) => {
    if (!projectSlug) return;
    try {
      const projectData = await getProjectBySlug(projectSlug);
      if (projectData) {
        setProjectTitle(projectData.title);
        setProjectId(projectData.id || '');
        const userIsMember = user ? isUserMemberOfProject(projectData, user.uid) : false;
        setIsUserMember(userIsMember);
        await loadTeamMembers(projectData.id || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
    }
  };

  useEffect(() => {
    if (!projectSlug && !loading) router.push('/portfolio/projet-en-cours');
  }, [projectSlug, loading, router]);

  const loadTeamMembers = async (pid: string) => {
    try {
      const members = await getProjectTeamMembers(pid);
      setTeamMembers(members.map((m) => normalizeMemberData(m)));
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleEditProfile = () => {
    if (currentUser && projectSlug) router.push(`/portfolio/team/edit?project=${projectSlug}`);
    else setShowLogin(true);
  };

  const handleBackToProjects = () => router.push('/portfolio/projet-en-cours');

  const shouldShowInfo = (isPublic: boolean): boolean => isUserMember || isPublic;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>Chargement de l'équipe...</div>
      </div>
    );
  }

  if (!projectSlug) {
    return (
      <div className={styles.mainContainer}>
        <Header />
        <div className={styles.loginCenter}>
          <button onClick={handleBackToProjects} className={styles.loginCenterButton}>
            <FolderKanban size={20} />
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className={styles.content}>
        <div className={styles.viewContainer}>
          {!currentUser ? (
            <div className={styles.loginCenter}>
              <button onClick={() => setShowLogin(true)} className={styles.loginCenterButton}>
                <User size={20} />
                Se connecter pour voir l'équipe
              </button>
            </div>
          ) : (
            <>
              <div className={styles.pageHeader}>
                <div>
                  <h1 className={styles.pageTitle}>
                    {projectTitle ? `Équipe - ${projectTitle}` : 'Équipe du projet'}
                  </h1>
                  <p className={styles.pageSubtitle}>
                    {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''} dans l'équipe
                    {isUserMember && (
                      <span className={styles.memberBadge}>
                        <Shield size={12} />
                        Membre
                      </span>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleBackToProjects} className={styles.editProfileButton}>
                    <FolderKanban size={16} />
                    Projets
                  </button>
                  {isUserMember && (
                    <button onClick={handleEditProfile} className={styles.editProfileButton}>
                      <User size={16} />
                      Mon Profil
                    </button>
                  )}
                </div>
              </div>

              {teamMembers.length > 0 ? (
                <div className={styles.teamGrid}>
                  {teamMembers.map((member, index) => (
                    <CardView
                      key={member.id}
                      member={member}
                      index={index}
                      shouldShowInfo={shouldShowInfo}
                      onClick={() => setSelectedMember(member)}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <User size={48} className={styles.emptyStateIcon} />
                  <h3 className={styles.emptyStateTitle}>Aucun membre dans ce projet</h3>
                  <p className={styles.emptyStateText}>
                    {isUserMember 
                      ? "Soyez le premier à créer votre profil d'équipe" 
                      : "Les membres de l'équipe n'ont pas encore créé leur profil"}
                  </p>
                  {isUserMember && (
                    <button onClick={handleEditProfile} className={styles.emptyStateButton}>
                      Créer mon profil
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedMember && (
        <DetailView
          member={selectedMember}
          isUserMember={isUserMember}
          currentUser={currentUser}
          shouldShowInfo={shouldShowInfo}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}

export default function TeamViewPage() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <Suspense
        fallback={
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Chargement...</div>
          </div>
        }
      >
        <TeamViewContent />
      </Suspense>
    </div>
  );
}