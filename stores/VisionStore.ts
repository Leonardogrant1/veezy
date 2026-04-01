import { create } from 'zustand';

export type Vision = {
  id: string;
  category: string;
  phrase: string;
  image: number | string; // require() asset OR remote URL
};

type VisionStore = {
  visions: Vision[];
  addVision: (vision: Omit<Vision, 'id'>) => void;
  updatePhrase: (id: string, phrase: string) => void;
  updateImage: (id: string, image: number | string) => void;
  deleteVision: (id: string) => void;
};

const DUMMY_VISIONS: Vision[] = [
  { id: '1', category: 'Karriere',   phrase: 'Ich bin ein erfolgreicher Unternehmer.',            image: require('@/assets/category-images/strength.jpg') },
  { id: '2', category: 'Gesundheit', phrase: 'Mein Körper ist stark und voller Energie.',         image: require('@/assets/category-images/endurance.jpeg') },
  { id: '3', category: 'Liebe',      phrase: 'Ich lebe in einer tiefen, liebevollen Beziehung.', image: require('@/assets/category-images/team.jpeg') },
  { id: '4', category: 'Finanzen',   phrase: 'Ich habe finanzielle Freiheit erreicht.',           image: require('@/assets/category-images/athletics.jpg') },
  { id: '5', category: 'Reisen',     phrase: 'Ich entdecke die Welt auf meinen eigenen Bedingungen.', image: require('@/assets/category-images/water.jpeg') },
  { id: '6', category: 'Lifestyle',  phrase: 'Ich lebe das Leben meiner Träume jeden Tag.',       image: require('@/assets/category-images/combat.jpg') },
];

export const useVisionStore = create<VisionStore>((set) => ({
  visions: DUMMY_VISIONS,
  addVision: (vision) => set((s) => ({
    visions: [...s.visions, { ...vision, id: Date.now().toString() }],
  })),
  updatePhrase: (id, phrase) => set((s) => ({ visions: s.visions.map((v) => v.id === id ? { ...v, phrase } : v) })),
  updateImage:  (id, image)  => set((s) => ({ visions: s.visions.map((v) => v.id === id ? { ...v, image }  : v) })),
  deleteVision: (id)         => set((s) => ({ visions: s.visions.filter((v) => v.id !== id) })),
}));
