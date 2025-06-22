// src/data/rolePlayScenarios.js

import courtroomSessionImg    from '../assets/images/courtroom_session.png';
import debateClubImg          from '../assets/images/debate_club.png';
import negotiationTableImg    from '../assets/images/negotiation_table.png';
import motherDaughterImg      from '../assets/images/mother_daughter.png';
import siblingRivalryImg      from '../assets/images/sibling_rivalry.png';
import grandparentImg         from '../assets/images/grandparent_grandchild.png';
import hiringInterviewImg     from '../assets/images/hiring_interview.png';
import performanceReviewImg   from '../assets/images/performance_review.png';
import clientPitchImg         from '../assets/images/client_pitch.png';
import customerSupportImg     from '../assets/images/customer_support.png';
import teacherStudentImg      from '../assets/images/teacher_student.png';
import mentorMenteeImg        from '../assets/images/mentor_mentee.png';
import fitnessCoachImg        from '../assets/images/fitness_coach.png';
import therapistPatientImg    from '../assets/images/therapist_patient.png';
import mysteryGameImg         from '../assets/images/mystery_game.png';
import superheroShowdownImg   from '../assets/images/superhero_showdown.png';
import pirateAdventureImg     from '../assets/images/pirate_adventure.png';
import riddlesPuzzlesImg      from '../assets/images/riddles_puzzles.png';
import standupHecklerImg      from '../assets/images/standup_heckler.png';
import comedyDuoImg           from '../assets/images/comedy_duo.png';
import talkShowImg            from '../assets/images/talk_show.png';
import improvSceneImg         from '../assets/images/improv_scene.png';
import dadJokesImg            from '../assets/images/dad_jokes.png';
import roastBanterImg         from '../assets/images/roast_banter.png';
import newsAnchorImg          from '../assets/images/news_anchor.png';
import podcastGuestImg        from '../assets/images/podcast_guest.png';
import celebrityInterviewImg  from '../assets/images/celebrity_interview.png';
import travelAgentImg         from '../assets/images/travel_agent.png';
import doctorNurseImg         from '../assets/images/doctor_nurse.png';
import emergencyDispatchImg   from '../assets/images/emergency_dispatch.png';
import wizardApprenticeImg    from '../assets/images/wizard_apprentice.png';
import spaceshipCaptainImg    from '../assets/images/spaceship_captain.png';
import timeTravelerImg        from '../assets/images/time_traveler.png';
import policeDispatchImg      from '../assets/images/police_dispatch.png';
import pastorCongregantImg    from '../assets/images/pastor_congregant.png';
import studentProjectPitchImg from '../assets/images/student_project_pitch.png';

export const availableScenarios = [
  // Professional & Workplace Scenarios - Matching backend constants.py
  {
    key: 'job_interview',
    label: 'Job Interview',
    subtitle: 'Candidate ↔ Interviewer',
    category: 'Professional & Workplace',
    prompt: 'You are the Job Candidate seeking employment. The Interviewer will ask about your qualifications and experience.',
    aiRole: 'Interviewer',
    userRole: 'Job Candidate',
    image: hiringInterviewImg,
    defaultVoice: 'en-US-Chirp3-HD-Charon'
  },
  {
    key: 'business_meeting',
    label: 'Business Meeting',
    subtitle: 'Team Member ↔ Team Leader',
    category: 'Professional & Workplace',
    prompt: 'You are a Team Member contributing to the business meeting. Share updates, voice concerns, and collaborate on solutions.',
    aiRole: 'Team Leader',
    userRole: 'Team Member',
    image: clientPitchImg,
    defaultVoice: 'en-US-Chirp3-HD-Puck'
  },
  {
    key: 'customer_service',
    label: 'Customer Service',
    subtitle: 'Customer ↔ Service Agent',
    category: 'Professional & Workplace',
    prompt: 'You are the Customer seeking resolution for a service issue. Explain your problem clearly and work with the agent.',
    aiRole: 'Service Agent',
    userRole: 'Customer',
    image: customerSupportImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },

  // Educational & Academic Scenarios - Matching backend constants.py
  {
    key: 'academic_discussion',
    label: 'Academic Discussion',
    subtitle: 'Student ↔ Professor',
    category: 'Educational & Academic',
    prompt: 'You are the Student actively participating in academic discourse. Ask thoughtful questions and share insights.',
    aiRole: 'Professor',
    userRole: 'Student',
    image: teacherStudentImg,
    defaultVoice: 'en-GB-Wavenet-B'
  },
  {
    key: 'tutoring_session',
    label: 'Tutoring Session',
    subtitle: 'Learner ↔ Tutor',
    category: 'Educational & Academic',
    prompt: 'You are the Learner seeking academic help and guidance. Ask questions and work through challenges.',
    aiRole: 'Tutor',
    userRole: 'Learner',
    image: mentorMenteeImg,
    defaultVoice: 'en-US-Chirp3-HD-Aoede'
  },

  // Healthcare & Medical Scenarios - Matching backend constants.py
  {
    key: 'medical_consultation',
    label: 'Medical Consultation',
    subtitle: 'Patient ↔ Doctor',
    category: 'Healthcare & Medical',
    prompt: 'You are the Patient seeking medical care and answers. Describe symptoms honestly and ask important health questions.',
    aiRole: 'Doctor',
    userRole: 'Patient',
    image: doctorNurseImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },

  // Creative & Entertainment Scenarios - Matching backend constants.py
  {
    key: 'creative_collaboration',
    label: 'Creative Collaboration',
    subtitle: 'Artist ↔ Director',
    category: 'Creative & Entertainment',
    prompt: 'You are the Artist contributing your creative talents to the collaboration. Share ideas and embrace artistic challenges.',
    aiRole: 'Creative Director',
    userRole: 'Artist',
    image: improvSceneImg,
    defaultVoice: 'en-US-Chirp3-HD-Betelgeuse'
  },

  // Travel & Cultural Scenarios - Matching backend constants.py
  {
    key: 'travel_planning',
    label: 'Travel Planning',
    subtitle: 'Traveler ↔ Travel Advisor',
    category: 'Travel & Cultural',
    prompt: 'You are the Traveler planning an exciting journey. Share your dreams and preferences for the perfect trip.',
    aiRole: 'Travel Advisor',
    userRole: 'Traveler',
    image: travelAgentImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },
  {
    key: 'cultural_exchange',
    label: 'Cultural Exchange',
    subtitle: 'Visitor ↔ Cultural Ambassador',
    category: 'Travel & Cultural',
    prompt: 'You are the Visitor eager to learn about different cultures and traditions. Ask respectful questions and share your own experiences.',
    aiRole: 'Cultural Ambassador',
    userRole: 'Visitor',
    image: wizardApprenticeImg, // Using existing image
    defaultVoice: 'en-US-Chirp3-HD-Kore'
  },

  // Casual & Social Scenarios - Matching backend constants.py
  {
    key: 'casual_conversation',
    label: 'Casual Conversation',
    subtitle: 'Chatty Person ↔ Friend',
    category: 'Casual & Social',
    prompt: 'You are the Conversationalist who enjoys sharing stories and connecting with others. Bring energy and enthusiasm to discussions.',
    aiRole: 'Friend',
    userRole: 'Chatty Person',
    image: grandparentImg, // Using existing image
    defaultVoice: 'en-US-Wavenet-E'
  }
];

// Helper function to get scenario by key
export const getScenarioByKey = (key) => {
  return availableScenarios.find(scenario => scenario.key === key);
};

// Helper function to get scenarios by category
export const getScenariosByCategory = (category) => {
  return availableScenarios.filter(scenario => scenario.category === category);
};

// Get all unique categories
export const getCategories = () => {
  const categories = [...new Set(availableScenarios.map(scenario => scenario.category))];
  return categories.sort();
};