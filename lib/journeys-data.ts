export interface Season {
    id: string;
    title: string;
    description: string;
    yearLabel: string;
    startDate: string; // ISO date string YYYY-MM-DD
    endDate: string;   // ISO date string YYYY-MM-DD
    theme?: {
        primaryColor: string;
        secondaryColor: string;
    };
}

export const seasons: Season[] = [
    {
        id: 'season-1',
        title: 'The Beginning',
        description: 'Where it all started. Raw, acoustic, and full of first steps.',
        yearLabel: '2023',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        theme: {
            primaryColor: '#e2e8f0', // slate-200
            secondaryColor: '#94a3b8', // slate-400
        }
    },
    {
        id: 'season-2',
        title: 'Growth & Discovery',
        description: 'Exploring new sounds and deeper themes. A time of expansion.',
        yearLabel: '2024',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        theme: {
            primaryColor: '#fcd34d', // amber-300
            secondaryColor: '#d97706', // amber-600
        }
    },
    {
        id: 'season-3',
        title: 'Refinement',
        description: 'Polishing the craft and finding the true voice.',
        yearLabel: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        theme: {
            primaryColor: '#a5b4fc', // indigo-300
            secondaryColor: '#4f46e5', // indigo-600
        }
    }
];
