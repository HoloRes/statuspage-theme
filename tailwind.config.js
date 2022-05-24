module.exports = {
	content: ['**/*.html'],
	darkMode: 'class',
	theme: {
		extend: {},
	},
	variants: {
		extend: {},
	},
	daisyui: {
		themes: [
			{
				light: {
					primary: '#3b66ed',
					'primary-content': '#06232E',
					secondary: '#00A0F2',
					'secondary-content': '#06232E',
					accent: '#091540',
					neutral: '#191D24',
					'base-100': '#e3f5fc',
					'base-content': '#000',
					info: '#00A0F2',
					success: '#9EF48A',
					warning: '#F9F871',
					error: '#FF626C',
				},
			},
			{
				dark: {
					primary: '#3b66ed',
					'primary-content': '#E3F5FC',
					secondary: '#3D518C',
					'secondary-content': '#E3F5FC',
					accent: '#091540',
					neutral: '#191D24',
					'base-100': '#2A303C',
					info: '#00A0F2',
					success: '#9EF48A',
					warning: '#F9F871',
					error: '#FF626C',
				},
			},
		],
	},
	plugins: [require('daisyui')],
};
