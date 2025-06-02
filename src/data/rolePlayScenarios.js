// src/data/rolePlayScenarios.js

import { ttsVoices } from './ttsVoices';

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
  // Legal & Debate - User roles complement the AI's roles
  {
    key: 'courtroom_session',
    label: 'Courtroom Session',
    subtitle: 'Defendant ↔ Judge',
    category: 'Legal & Debate',
    prompt: 'You are the Defendant in court. The Judge will address you. Respond respectfully and explain your case.',
    aiRole: 'Judge',
    userRole: 'Defendant',
    image: courtroomSessionImg,
    defaultVoice: 'en-US-Chirp3-HD-Charon'
  },
  {
    key: 'debate_club',
    label: 'Debate Club',
    subtitle: 'Participant ↔ Moderator',
    category: 'Legal & Debate',
    prompt: 'You are a Debate Participant. The Moderator will challenge your arguments. Present your case clearly and defend your position.',
    aiRole: 'Debate Moderator',
    userRole: 'Debate Participant',
    image: debateClubImg,
    defaultVoice: 'en-GB-Wavenet-B'
  },
  {
    key: 'negotiation_table',
    label: 'Business Negotiation',
    subtitle: 'Buyer ↔ Seller',
    category: 'Legal & Debate',
    prompt: 'You are the Buyer in a negotiation. The Seller will present their terms. Make your offers and negotiate the best deal.',
    aiRole: 'Seller',
    userRole: 'Buyer',
    image: negotiationTableImg,
    defaultVoice: 'en-US-Chirp3-HD-Puck'
  },

  // Family & Relationships - Fixed role alignment
  {
    key: 'mother_daughter',
    label: 'Mother ↔ Daughter',
    subtitle: 'Family Conversation',
    category: 'Family & Relationships',
    prompt: 'You are the Mother talking with your daughter. Share your thoughts, ask about her day, and engage in warm family conversation.',
    aiRole: 'Daughter',
    userRole: 'Mother',
    image: motherDaughterImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },
  {
    key: 'sibling_rivalry',
    label: 'Sibling Chat',
    subtitle: 'Brother ↔ Sister',
    category: 'Family & Relationships',
    prompt: 'You are the Brother having a playful conversation with your sister. Tease gently and keep the sibling bond fun.',
    aiRole: 'Sister',
    userRole: 'Brother',
    image: siblingRivalryImg,
    defaultVoice: 'en-US-Chirp3-HD-Puck'
  },
  {
    key: 'grandparent_grandchild',
    label: 'Grandparent ↔ Grandchild',
    subtitle: 'Wisdom Sharing',
    category: 'Family & Relationships',
    prompt: 'You are the Grandparent sharing wisdom with your grandchild. Offer advice and life lessons in a caring way.',
    aiRole: 'Grandchild',
    userRole: 'Grandparent',
    image: grandparentImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },

  // Professional & Interview - Fixed role alignment
  {
    key: 'hiring_interview',
    label: 'Job Interview',
    subtitle: 'Candidate ↔ Interviewer',
    category: 'Professional & Interview',
    prompt: 'You are the Job Candidate being interviewed. Answer questions confidently and ask about the role to show your interest.',
    aiRole: 'Interviewer',
    userRole: 'Job Candidate',
    image: hiringInterviewImg,
    defaultVoice: 'en-US-Wavenet-D'
  },
  {
    key: 'performance_review',
    label: 'Performance Review',
    subtitle: 'Employee ↔ Manager',
    category: 'Professional & Interview',
    prompt: 'You are the Employee in a performance review. Listen to feedback, ask questions, and discuss your goals.',
    aiRole: 'Manager',
    userRole: 'Employee',
    image: performanceReviewImg,
    defaultVoice: 'en-US-Chirp3-HD-Orus'
  },
  {
    key: 'client_pitch',
    label: 'Client Meeting',
    subtitle: 'Consultant ↔ Client',
    category: 'Professional & Interview',
    prompt: 'You are the Consultant presenting to a client. Pitch your solution and address their concerns professionally.',
    aiRole: 'Client',
    userRole: 'Consultant',
    image: clientPitchImg,
    defaultVoice: 'en-US-Wavenet-C'
  },
  {
    key: 'customer_support',
    label: 'Customer Support',
    subtitle: 'Customer ↔ Agent',
    category: 'Professional & Interview',
    prompt: 'You are the Customer seeking help. Explain your issue clearly and work with the support agent to resolve it.',
    aiRole: 'Support Agent',
    userRole: 'Customer',
    image: customerSupportImg,
    defaultVoice: 'en-US-Chirp3-HD-Kore'
  },

  // Learning & Coaching - Fixed role alignment
  {
    key: 'teacher_student',
    label: 'Teacher ↔ Student',
    subtitle: 'Learning Session',
    category: 'Learning & Coaching',
    prompt: 'You are the Student in class. Ask questions, participate actively, and show enthusiasm for learning.',
    aiRole: 'Teacher',
    userRole: 'Student',
    image: teacherStudentImg,
    defaultVoice: 'en-GB-Wavenet-D'
  },
  {
    key: 'mentor_mentee',
    label: 'Mentor ↔ Mentee',
    subtitle: 'Career Guidance',
    category: 'Learning & Coaching',
    prompt: 'You are the Mentee seeking career guidance. Ask specific questions and share your challenges and goals.',
    aiRole: 'Mentor',
    userRole: 'Mentee',
    image: mentorMenteeImg,
    defaultVoice: 'en-GB-Wavenet-D'
  },
  {
    key: 'fitness_coach',
    label: 'Fitness Coach ↔ Client',
    subtitle: 'Training Session',
    category: 'Learning & Coaching',
    prompt: 'You are the Client working with a fitness coach. Ask about exercises, share your goals, and show motivation.',
    aiRole: 'Fitness Coach',
    userRole: 'Client',
    image: fitnessCoachImg,
    defaultVoice: 'en-US-Chirp3-HD-Kore'
  },
  {
    key: 'therapist_patient',
    label: 'Therapist ↔ Patient',
    subtitle: 'Therapy Session',
    category: 'Learning & Coaching',
    prompt: 'You are the Patient in therapy. Share your feelings, ask for guidance, and engage in the healing process.',
    aiRole: 'Therapist',
    userRole: 'Patient',
    image: therapistPatientImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },

  // Creative & Fun - Fixed role alignment
  {
    key: 'mystery_game',
    label: 'Detective Story',
    subtitle: 'Suspect ↔ Detective',
    category: 'Creative & Fun',
    prompt: 'You are the Suspect being questioned. Stay in character, provide alibis, and maintain your story convincingly.',
    aiRole: 'Detective',
    userRole: 'Suspect',
    image: mysteryGameImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },
  {
    key: 'superhero_showdown',
    label: 'Superhero Adventure',
    subtitle: 'Villain ↔ Superhero',
    category: 'Creative & Fun',
    prompt: 'You are the Villain facing off against a superhero. Respond with dramatic flair and villainous wit.',
    aiRole: 'Superhero',
    userRole: 'Villain',
    image: superheroShowdownImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },
  {
    key: 'pirate_adventure',
    label: 'Pirate Ship',
    subtitle: 'Crew Member ↔ Captain',
    category: 'Creative & Fun',
    prompt: 'You are a Crew Member on a pirate ship. Respond to your captain\'s orders with enthusiasm and pirate flair.',
    aiRole: 'Pirate Captain',
    userRole: 'Crew Member',
    image: pirateAdventureImg,
    defaultVoice: 'en-US-Chirp3-HD-Puck'
  },
  {
    key: 'riddles_puzzles',
    label: 'Puzzle Challenge',
    subtitle: 'Solver ↔ Puzzle Master',
    category: 'Creative & Fun',
    prompt: 'You are the Puzzle Solver working with the puzzle master. Think aloud, ask for hints, and celebrate your solutions.',
    aiRole: 'Puzzle Master',
    userRole: 'Puzzle Solver',
    image: riddlesPuzzlesImg,
    defaultVoice: 'en-US-Chirp3-HD-Aoede'
  },

  // Comedy & Humor - Fixed role alignment
  {
    key: 'standup_heckler',
    label: 'Comedy Club',
    subtitle: 'Audience ↔ Comedian',
    category: 'Comedy & Humor',
    prompt: 'You are an Audience Member at a comedy show. React to jokes, engage with the comedian, and add to the humor.',
    aiRole: 'Comedian',
    userRole: 'Audience Member',
    image: standupHecklerImg,
    defaultVoice: 'en-US-Chirp3-HD-Betelgeuse'
  },
  {
    key: 'comedy_duo',
    label: 'Comedy Writers',
    subtitle: 'Creative Partners',
    category: 'Comedy & Humor',
    prompt: 'You are a Comedy Writer collaborating with your partner. Build on ideas, suggest improvements, and bounce jokes back and forth.',
    aiRole: 'Comedy Writer Partner',
    userRole: 'Comedy Writer',
    image: comedyDuoImg,
    defaultVoice: 'en-US-Wavenet-E'
  },
  {
    key: 'talk_show',
    label: 'Late-Night Talk Show',
    subtitle: 'Celebrity ↔ Host',
    category: 'Comedy & Humor',
    prompt: 'You are the Celebrity Guest on a talk show. Share interesting stories, answer questions charmingly, and entertain the audience.',
    aiRole: 'Talk Show Host',
    userRole: 'Celebrity Guest',
    image: talkShowImg,
    defaultVoice: 'en-US-Chirp3-HD-Charon'
  },
  {
    key: 'improv_scene',
    label: 'Improv Theater',
    subtitle: 'Alien Tourist ↔ Guide',
    category: 'Comedy & Humor',
    prompt: 'You are an Alien Tourist visiting Earth. Ask fascinating questions about human culture and express amazement at everything.',
    aiRole: 'Tour Guide',
    userRole: 'Alien Tourist',
    image: improvSceneImg,
    defaultVoice: 'en-US-Chirp3-HD-Aoede'
  },
  {
    key: 'dad_jokes',
    label: 'Dad Joke Battle',
    subtitle: 'Audience ↔ Dad',
    category: 'Comedy & Humor',
    prompt: 'You are the Audience Member listening to dad jokes. Groan appropriately, laugh despite yourself, and request more jokes.',
    aiRole: 'Dad',
    userRole: 'Audience Member',
    image: dadJokesImg,
    defaultVoice: 'en-US-Chirp3-HD-Aoede'
  },
  {
    key: 'roast_banter',
    label: 'Friendly Roasting',
    subtitle: 'Roast Participants',
    category: 'Comedy & Humor',
    prompt: 'You are participating in friendly roast banter. Give witty comebacks, laugh at good jokes, and keep the energy fun and playful.',
    aiRole: 'Roast Partner',
    userRole: 'Roast Participant',
    image: roastBanterImg,
    defaultVoice: 'en-US-Chirp3-HD-Betelgeuse'
  },

  // Media & Interview - Fixed role alignment
  {
    key: 'news_anchor',
    label: 'News Broadcast',
    subtitle: 'Field Reporter ↔ Anchor',
    category: 'Media & Interview',
    prompt: 'You are the Field Reporter providing live updates to the news anchor. Deliver information clearly and respond to their questions.',
    aiRole: 'News Anchor',
    userRole: 'Field Reporter',
    image: newsAnchorImg,
    defaultVoice: 'en-US-Wavenet-B'
  },
  {
    key: 'podcast_guest',
    label: 'Podcast Interview',
    subtitle: 'Guest ↔ Host',
    category: 'Media & Interview',
    prompt: 'You are the Podcast Guest sharing your expertise. Tell engaging stories, provide valuable insights, and connect with the audience.',
    aiRole: 'Podcast Host',
    userRole: 'Podcast Guest',
    image: podcastGuestImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },
  {
    key: 'celebrity_interview',
    label: 'Celebrity Interview',
    subtitle: 'Celebrity ↔ Interviewer',
    category: 'Media & Interview',
    prompt: 'You are the Celebrity being interviewed. Share behind-the-scenes stories, connect with your fans, and show your personality.',
    aiRole: 'Interviewer',
    userRole: 'Celebrity',
    image: celebrityInterviewImg,
    defaultVoice: 'en-US-Wavenet-D'
  },

  // Service & Simulation - Fixed role alignment
  {
    key: 'travel_agent',
    label: 'Travel Planning',
    subtitle: 'Traveler ↔ Agent',
    category: 'Service & Simulation',
    prompt: 'You are the Traveler planning your dream vacation. Ask detailed questions, express enthusiasm about destinations, and share your travel preferences.',
    aiRole: 'Travel Agent',
    userRole: 'Traveler',
    image: travelAgentImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },
  {
    key: 'doctor_nurse',
    label: 'Medical Team',
    subtitle: 'Nurse ↔ Doctor',
    category: 'Service & Simulation',
    prompt: 'You are the Nurse providing patient information to the doctor. Be professional, detailed, and efficient in your medical reports.',
    aiRole: 'Doctor',
    userRole: 'Nurse',
    image: doctorNurseImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },
  {
    key: 'emergency_dispatch',
    label: 'Emergency Call',
    subtitle: 'Caller ↔ Dispatcher',
    category: 'Service & Simulation',
    prompt: 'You are the Emergency Caller reporting an incident. Provide clear details, stay calm, and follow the dispatcher\'s instructions.',
    aiRole: 'Emergency Dispatcher',
    userRole: 'Emergency Caller',
    image: emergencyDispatchImg,
    defaultVoice: 'en-US-Wavenet-C'
  },

  // Fantasy & Sci-Fi - Fixed role alignment
  {
    key: 'wizard_apprentice',
    label: 'Magic Academy',
    subtitle: 'Apprentice ↔ Wizard',
    category: 'Fantasy & Sci-Fi',
    prompt: 'You are the Apprentice learning magic from your wizard master. Ask questions about spells, show wonder at magic, and be eager to learn.',
    aiRole: 'Wizard',
    userRole: 'Apprentice',
    image: wizardApprenticeImg,
    defaultVoice: 'en-US-Chirp3-HD-Aoede'
  },
  {
    key: 'spaceship_captain',
    label: 'Space Mission',
    subtitle: 'Crew Member ↔ Captain',
    category: 'Fantasy & Sci-Fi',
    prompt: 'You are a dedicated Crew Member following your captain\'s orders during a space mission. Respond with urgency and professionalism.',
    aiRole: 'Spaceship Captain',
    userRole: 'Crew Member',
    image: spaceshipCaptainImg,
    defaultVoice: 'en-US-Chirp3-HD-Puck'
  },
  {
    key: 'time_traveler',
    label: 'Time Travel Adventure',
    subtitle: 'Time Traveler ↔ Historian',
    category: 'Fantasy & Sci-Fi',
    prompt: 'You are the Time Traveler visiting a historical period. Ask the historian fascinating questions about their era and express amazement at the differences.',
    aiRole: 'Historian',
    userRole: 'Time Traveler',
    image: timeTravelerImg,
    defaultVoice: 'en-US-Chirp3-HD-Kore'
  },

  // Additional scenarios - Fixed role alignment
  {
    key: 'police_dispatch',
    label: 'Police Response',
    subtitle: 'Citizen ↔ Officer',
    category: 'Service & Simulation',
    prompt: 'You are a concerned Citizen reporting an incident to a police officer. Provide clear details about the situation and cooperate fully.',
    aiRole: 'Police Officer',
    userRole: 'Concerned Citizen',
    image: policeDispatchImg,
    defaultVoice: 'en-US-Chirp3-HD-Fenrir'
  },
  {
    key: 'pastor_congregant',
    label: 'Spiritual Guidance',
    subtitle: 'Congregant ↔ Pastor',
    category: 'Family & Relationships',
    prompt: 'You are the Congregant seeking spiritual guidance from your pastor. Share your concerns, ask thoughtful questions, and engage in meaningful discussion.',
    aiRole: 'Pastor',
    userRole: 'Congregant',
    image: pastorCongregantImg,
    defaultVoice: 'en-US-Chirp3-HD-Leda'
  },
  {
    key: 'student_project_pitch',
    label: 'Academic Presentation',
    subtitle: 'Student ↔ Professor',
    category: 'Education & Presentation',
    prompt: 'You are a University Student (Bachelor/Master/PhD) pitching your research project to professors. Present your goals clearly and respond to academic questions.',
    aiRole: 'Professor',
    userRole: 'University Student',
    image: studentProjectPitchImg,
    defaultVoice: 'en-US-Wavenet-A'
  },
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