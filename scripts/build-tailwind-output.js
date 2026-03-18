const fs = require('fs');
const path = require('path');

const breakpoints = {
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
};

const colorHex = {
  white: '#ffffff',
  black: '#000000',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'blue-800': '#1e40af',
  'blue-900': '#1e3a8a',
  'green-100': '#dcfce7',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'green-700': '#15803d',
  'indigo-100': '#e0e7ff',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'orange-50': '#fff7ed',
  'orange-100': '#ffedd5',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
  'orange-700': '#c2410c',
  'orange-800': '#9a3412',
  'purple-100': '#f3e8ff',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'purple-700': '#7e22ce',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',
  'red-100': '#fee2e2',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'yellow-50': '#fefce8',
  'yellow-100': '#fef9c3',
  'yellow-200': '#fef08a',
  'yellow-700': '#a16207',
};

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(value, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

function escapeClassName(className) {
  return className
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function bgDecl(key, opacityVar = '--tw-bg-opacity') {
  const rgb = hexToRgb(colorHex[key]);
  return `background-color: rgb(${rgb} / var(${opacityVar}, 1));`;
}

function textDecl(key, opacityVar = '--tw-text-opacity') {
  const rgb = hexToRgb(colorHex[key]);
  return `color: rgb(${rgb} / var(${opacityVar}, 1));`;
}

function borderDecl(key, opacityVar = '--tw-border-opacity') {
  const rgb = hexToRgb(colorHex[key]);
  return `border-color: rgb(${rgb} / var(${opacityVar}, 1));`;
}

const utilities = {
  absolute: 'position:absolute;',
  relative: 'position:relative;',
  fixed: 'position:fixed;',
  sticky: 'position:sticky;',
  block: 'display:block;',
  'inline-block': 'display:inline-block;',
  flex: 'display:flex;',
  grid: 'display:grid;',
  hidden: 'display:none;',
  'inline-flex': 'display:inline-flex;',
  'flex-col': 'flex-direction:column;',
  'flex-wrap': 'flex-wrap:wrap;',
  'flex-1': 'flex:1 1 0%;',
  'flex-shrink-0': 'flex-shrink:0;',
  'items-center': 'align-items:center;',
  'items-start': 'align-items:flex-start;',
  'justify-between': 'justify-content:space-between;',
  'justify-center': 'justify-content:center;',
  'justify-end': 'justify-content:flex-end;',
  'text-left': 'text-align:left;',
  'text-center': 'text-align:center;',
  'text-right': 'text-align:right;',
  'font-medium': 'font-weight:500;',
  'font-semibold': 'font-weight:600;',
  'font-bold': 'font-weight:700;',
  'font-mono': 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;',
  italic: 'font-style:italic;',
  underline: 'text-decoration-line:underline;',
  truncate: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
  'break-all': 'word-break:break-all;',
  'whitespace-nowrap': 'white-space:nowrap;',
  'appearance-none': 'appearance:none;',
  'object-cover': 'object-fit:cover;',
  'cursor-pointer': 'cursor:pointer;',
  'pointer-events-none': 'pointer-events:none;',
  'overflow-hidden': 'overflow:hidden;',
  'overflow-x-auto': 'overflow-x:auto;',
  'overflow-y-auto': 'overflow-y:auto;',
  'rounded': 'border-radius:0.25rem;',
  'rounded-lg': 'border-radius:0.5rem;',
  'rounded-full': 'border-radius:9999px;',
  border: 'border-width:1px;',
  'border-2': 'border-width:2px;',
  'border-b': 'border-bottom-width:1px;',
  'border-t': 'border-top-width:1px;',
  shadow: 'box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);',
  'shadow-sm': 'box-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05);',
  'shadow-lg': 'box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);',
  'transition-shadow': 'transition-property:box-shadow;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms;',
  'transition-colors': 'transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms;',
  'transition-transform': 'transition-property:transform;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms;',
  'hover:scale-105': 'transform:scale(1.05);',
  'focus:outline-none': 'outline:2px solid transparent;outline-offset:2px;',
  'focus:ring-2': 'box-shadow:0 0 0 2px var(--tw-ring-color, rgb(59 130 246 / 0.5));',
  'focus:border-white/50': 'border-color:rgb(255 255 255 / 0.5);',
  'checked:bg-blue-600': bgDecl('blue-600'),
  'checked:border-blue-600': borderDecl('blue-600'),
  'bg-opacity-50': '--tw-bg-opacity:0.5;',
  'border-opacity-30': '--tw-border-opacity:0.3;',
  'bg-gradient-to-br': 'background-image:linear-gradient(to bottom right, var(--tw-gradient-stops));',
  'from-blue-500': `--tw-gradient-from:${colorHex['blue-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(59 130 246 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'from-green-500': `--tw-gradient-from:${colorHex['green-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(34 197 94 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'from-indigo-500': `--tw-gradient-from:${colorHex['indigo-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(99 102 241 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'from-orange-500': `--tw-gradient-from:${colorHex['orange-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(249 115 22 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'from-purple-500': `--tw-gradient-from:${colorHex['purple-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(168 85 247 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'from-pink-500': `--tw-gradient-from:${colorHex['pink-500']} var(--tw-gradient-from-position);--tw-gradient-to:rgb(236 72 153 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);`,
  'to-blue-600': `--tw-gradient-to:${colorHex['blue-600']} var(--tw-gradient-to-position);`,
  'to-green-600': `--tw-gradient-to:${colorHex['green-600']} var(--tw-gradient-to-position);`,
  'to-indigo-600': `--tw-gradient-to:${colorHex['indigo-600']} var(--tw-gradient-to-position);`,
  'to-orange-600': `--tw-gradient-to:${colorHex['orange-600']} var(--tw-gradient-to-position);`,
  'to-purple-600': `--tw-gradient-to:${colorHex['purple-600']} var(--tw-gradient-to-position);`,
  'to-pink-600': `--tw-gradient-to:${colorHex['pink-600']} var(--tw-gradient-to-position);`,
  'bg-black': bgDecl('black'),
  'bg-white': bgDecl('white'),
  'bg-gray-50': bgDecl('gray-50'),
  'bg-gray-100': bgDecl('gray-100'),
  'bg-gray-200': bgDecl('gray-200'),
  'bg-gray-500': bgDecl('gray-500'),
  'bg-gray-700': bgDecl('gray-700'),
  'bg-gray-800': bgDecl('gray-800'),
  'bg-blue-50': bgDecl('blue-50'),
  'bg-blue-100': bgDecl('blue-100'),
  'bg-blue-600': bgDecl('blue-600'),
  'bg-green-100': bgDecl('green-100'),
  'bg-green-600': bgDecl('green-600'),
  'bg-indigo-100': bgDecl('indigo-100'),
  'bg-indigo-600': bgDecl('indigo-600'),
  'bg-orange-50': bgDecl('orange-50'),
  'bg-orange-100': bgDecl('orange-100'),
  'bg-orange-600': bgDecl('orange-600'),
  'bg-purple-100': bgDecl('purple-100'),
  'bg-purple-600': bgDecl('purple-600'),
  'bg-red-100': bgDecl('red-100'),
  'bg-red-600': bgDecl('red-600'),
  'bg-yellow-50': bgDecl('yellow-50'),
  'bg-yellow-100': bgDecl('yellow-100'),
  'bg-white/10': 'background-color:rgb(255 255 255 / 0.1);',
  'text-white': textDecl('white'),
  'text-gray-400': textDecl('gray-400'),
  'text-gray-500': textDecl('gray-500'),
  'text-gray-600': textDecl('gray-600'),
  'text-gray-700': textDecl('gray-700'),
  'text-gray-800': textDecl('gray-800'),
  'text-gray-900': textDecl('gray-900'),
  'text-blue-100': textDecl('blue-100'),
  'text-blue-600': textDecl('blue-600'),
  'text-blue-700': textDecl('blue-700'),
  'text-blue-800': textDecl('blue-800'),
  'text-blue-900': textDecl('blue-900'),
  'text-green-600': textDecl('green-600'),
  'text-green-700': textDecl('green-700'),
  'text-indigo-700': textDecl('indigo-700'),
  'text-orange-800': textDecl('orange-800'),
  'text-purple-700': textDecl('purple-700'),
  'text-red-500': textDecl('red-500'),
  'text-red-600': textDecl('red-600'),
  'text-red-700': textDecl('red-700'),
  'text-yellow-700': textDecl('yellow-700'),
  'border-white': borderDecl('white'),
  'border-white/30': 'border-color:rgb(255 255 255 / 0.3);',
  'border-gray-100': borderDecl('gray-100'),
  'border-gray-200': borderDecl('gray-200'),
  'border-gray-300': borderDecl('gray-300'),
  'border-blue-200': borderDecl('blue-200'),
  'border-blue-600': borderDecl('blue-600'),
  'border-yellow-200': borderDecl('yellow-200'),
  'placeholder-white/70': '::placeholder{color:rgb(255 255 255 / 0.7);}',
  'text-xs': 'font-size:0.75rem;line-height:1rem;',
  'text-sm': 'font-size:0.875rem;line-height:1.25rem;',
  'text-base': 'font-size:1rem;line-height:1.5rem;',
  'text-lg': 'font-size:1.125rem;line-height:1.75rem;',
  'text-xl': 'font-size:1.25rem;line-height:1.75rem;',
  'text-2xl': 'font-size:1.5rem;line-height:2rem;',
  'text-3xl': 'font-size:1.875rem;line-height:2.25rem;',
  'text-4xl': 'font-size:2.25rem;line-height:2.5rem;',
  'text-6xl': 'font-size:3.75rem;line-height:1;',
  'text-[11px]': 'font-size:11px;',
  'w-4': 'width:1rem;',
  'w-5': 'width:1.25rem;',
  'w-12': 'width:3rem;',
  'w-16': 'width:4rem;',
  'w-20': 'width:5rem;',
  'w-24': 'width:6rem;',
  'w-28': 'width:7rem;',
  'w-auto': 'width:auto;',
  'w-fit': 'width:fit-content;',
  'w-full': 'width:100%;',
  'h-4': 'height:1rem;',
  'h-5': 'height:1.25rem;',
  'h-6': 'height:1.5rem;',
  'h-8': 'height:2rem;',
  'h-10': 'height:2.5rem;',
  'h-12': 'height:3rem;',
  'h-14': 'height:3.5rem;',
  'h-16': 'height:4rem;',
  'h-20': 'height:5rem;',
  'h-24': 'height:6rem;',
  'h-48': 'height:12rem;',
  'h-64': 'height:16rem;',
  'h-full': 'height:100%;',
  'max-w-md': 'max-width:28rem;',
  'max-w-2xl': 'max-width:42rem;',
  'max-w-4xl': 'max-width:56rem;',
  'max-w-6xl': 'max-width:72rem;',
  'max-w-7xl': 'max-width:80rem;',
  'max-h-48': 'max-height:12rem;',
  'max-h-60': 'max-height:15rem;',
  'max-h-[70vh]': 'max-height:70vh;',
  'min-w-0': 'min-width:0;',
  'min-w-[200px]': 'min-width:200px;',
  'grid-cols-1': 'grid-template-columns:repeat(1,minmax(0,1fr));',
  'grid-cols-2': 'grid-template-columns:repeat(2,minmax(0,1fr));',
  'col-span-full': 'grid-column:1 / -1;',
  'gap-1': 'gap:0.25rem;',
  'gap-1.5': 'gap:0.375rem;',
  'gap-2': 'gap:0.5rem;',
  'gap-3': 'gap:0.75rem;',
  'gap-4': 'gap:1rem;',
  'gap-6': 'gap:1.5rem;',
  'p-1': 'padding:0.25rem;',
  'p-1.5': 'padding:0.375rem;',
  'p-2': 'padding:0.5rem;',
  'p-3': 'padding:0.75rem;',
  'p-4': 'padding:1rem;',
  'p-6': 'padding:1.5rem;',
  'p-8': 'padding:2rem;',
  'px-2': 'padding-left:0.5rem;padding-right:0.5rem;',
  'px-3': 'padding-left:0.75rem;padding-right:0.75rem;',
  'px-4': 'padding-left:1rem;padding-right:1rem;',
  'px-6': 'padding-left:1.5rem;padding-right:1.5rem;',
  'py-0.5': 'padding-top:0.125rem;padding-bottom:0.125rem;',
  'py-1': 'padding-top:0.25rem;padding-bottom:0.25rem;',
  'py-1.5': 'padding-top:0.375rem;padding-bottom:0.375rem;',
  'py-2': 'padding-top:0.5rem;padding-bottom:0.5rem;',
  'py-3': 'padding-top:0.75rem;padding-bottom:0.75rem;',
  'py-4': 'padding-top:1rem;padding-bottom:1rem;',
  'py-6': 'padding-top:1.5rem;padding-bottom:1.5rem;',
  'py-8': 'padding-top:2rem;padding-bottom:2rem;',
  'py-10': 'padding-top:2.5rem;padding-bottom:2.5rem;',
  'py-12': 'padding-top:3rem;padding-bottom:3rem;',
  'pt-2': 'padding-top:0.5rem;',
  'pt-3': 'padding-top:0.75rem;',
  'pt-4': 'padding-top:1rem;',
  'pt-6': 'padding-top:1.5rem;',
  'pb-2': 'padding-bottom:0.5rem;',
  'pl-10': 'padding-left:2.5rem;',
  'pr-4': 'padding-right:1rem;',
  'pr-8': 'padding-right:2rem;',
  'pr-12': 'padding-right:3rem;',
  'mb-1': 'margin-bottom:0.25rem;',
  'mb-2': 'margin-bottom:0.5rem;',
  'mb-3': 'margin-bottom:0.75rem;',
  'mb-4': 'margin-bottom:1rem;',
  'mb-6': 'margin-bottom:1.5rem;',
  'mb-24': 'margin-bottom:6rem;',
  'ml-2': 'margin-left:0.5rem;',
  'ml-4': 'margin-left:1rem;',
  'ml-auto': 'margin-left:auto;',
  'mr-2': 'margin-right:0.5rem;',
  'mt-0.5': 'margin-top:0.125rem;',
  'mt-1': 'margin-top:0.25rem;',
  'mt-2': 'margin-top:0.5rem;',
  'mt-3': 'margin-top:0.75rem;',
  'mt-4': 'margin-top:1rem;',
  'mt-6': 'margin-top:1.5rem;',
  'mt-8': 'margin-top:2rem;',
  'mx-auto': 'margin-left:auto;margin-right:auto;',
  'my-8': 'margin-top:2rem;margin-bottom:2rem;',
  'space-y-1': '> :not([hidden]) ~ :not([hidden]){margin-top:0.25rem;}',
  'space-y-2': '> :not([hidden]) ~ :not([hidden]){margin-top:0.5rem;}',
  'space-y-3': '> :not([hidden]) ~ :not([hidden]){margin-top:0.75rem;}',
  'space-y-4': '> :not([hidden]) ~ :not([hidden]){margin-top:1rem;}',
  'space-y-6': '> :not([hidden]) ~ :not([hidden]){margin-top:1.5rem;}',
  'top-0': 'top:0;',
  'top-1/2': 'top:50%;',
  'top-2': 'top:0.5rem;',
  'top-full': 'top:100%;',
  'left-0': 'left:0;',
  'left-2': 'left:0.5rem;',
  'left-3': 'left:0.75rem;',
  'right-0': 'right:0;',
  'inset-0': 'inset:0;',
  '-translate-y-1/2': 'transform:translateY(-50%);',
  'z-10': 'z-index:10;',
  'z-40': 'z-index:40;',
  'z-50': 'z-index:50;',
  'line-clamp-1': 'overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;',
  'line-clamp-2': 'overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;',
};

const responsiveUtilities = {
  'sm:inline': 'display:inline;',
  'sm:grid-cols-3': 'grid-template-columns:repeat(3,minmax(0,1fr));',
  'md:hidden': 'display:none;',
  'md:h-24': 'height:6rem;',
  'md:h-96': 'height:24rem;',
  'md:w-24': 'width:6rem;',
  'md:grid-cols-2': 'grid-template-columns:repeat(2,minmax(0,1fr));',
  'md:grid-cols-3': 'grid-template-columns:repeat(3,minmax(0,1fr));',
  'md:grid-cols-4': 'grid-template-columns:repeat(4,minmax(0,1fr));',
  'md:col-span-2': 'grid-column:span 2 / span 2;',
  'lg:flex': 'display:flex;',
  'lg:hidden': 'display:none;',
  'lg:grid-cols-3': 'grid-template-columns:repeat(3,minmax(0,1fr));',
  'lg:grid-cols-6': 'grid-template-columns:repeat(6,minmax(0,1fr));',
};

const pseudoUtilities = {
  'hover:bg-blue-200': bgDecl('blue-200'),
  'hover:bg-blue-50': bgDecl('blue-50'),
  'hover:bg-blue-700': bgDecl('blue-700'),
  'hover:bg-gray-100': bgDecl('gray-100'),
  'hover:bg-gray-200': bgDecl('gray-200'),
  'hover:bg-gray-300': borderDecl('gray-300').replace('border-color', 'background-color'),
  'hover:bg-gray-50': bgDecl('gray-50'),
  'hover:bg-gray-700': bgDecl('gray-700'),
  'hover:bg-gray-800': bgDecl('gray-800'),
  'hover:bg-gray-900': bgDecl('gray-900'),
  'hover:bg-green-200': 'background-color:#bbf7d0;',
  'hover:bg-green-700': bgDecl('green-700'),
  'hover:bg-indigo-200': 'background-color:#c7d2fe;',
  'hover:bg-orange-50': bgDecl('orange-50'),
  'hover:bg-orange-700': bgDecl('orange-700'),
  'hover:bg-purple-200': 'background-color:#e9d5ff;',
  'hover:bg-purple-700': bgDecl('purple-700'),
  'hover:bg-red-200': 'background-color:#fecaca;',
  'hover:bg-red-700': bgDecl('red-700'),
  'hover:opacity-90': 'opacity:0.9;',
  'hover:shadow-lg': utilities['shadow-lg'],
  'hover:text-blue-600': textDecl('blue-600'),
  'hover:text-blue-700': textDecl('blue-700'),
  'hover:text-blue-800': textDecl('blue-800'),
  'hover:text-gray-600': textDecl('gray-600'),
  'hover:text-gray-700': textDecl('gray-700'),
  'hover:text-gray-900': textDecl('gray-900'),
  'hover:text-red-700': textDecl('red-700'),
  'hover:underline': 'text-decoration-line:underline;',
};

let css = `/* Generated repo-local output.css replacing the Tailwind CDN for this project. */\n`;
css += `*,::before,::after{box-sizing:border-box;}\nhtml{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;}\nbody{margin:0;line-height:inherit;}\nbutton,input,select,textarea{font:inherit;color:inherit;margin:0;}\na{color:inherit;text-decoration:inherit;}\nimg,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle;}\nimg,video{max-width:100%;height:auto;}\n[hidden]{display:none !important;}\n`;

for (const [cls, decl] of Object.entries(utilities)) {
  if (cls === 'placeholder-white/70') {
    css += `.${escapeClassName('placeholder-white/70')}::placeholder{color:rgb(255 255 255 / 0.7);}\n`;
  } else if (cls.startsWith('space-y-')) {
    css += `.${escapeClassName(cls)}${decl}\n`;
  } else if (cls.startsWith('focus:')) {
    const base = cls.replace('focus:', '');
    css += `.${escapeClassName(cls)}:focus{${decl}}\n`;
  } else if (cls.startsWith('checked:')) {
    css += `.${escapeClassName(cls)}:checked{${decl}}\n`;
  } else if (cls.startsWith('hover:')) {
    css += `.${escapeClassName(cls)}:hover{${decl}}\n`;
  } else {
    css += `.${escapeClassName(cls)}{${decl}}\n`;
  }
}

for (const [cls, decl] of Object.entries(pseudoUtilities)) {
  css += `.${escapeClassName(cls)}:hover{${decl}}\n`;
}

const grouped = {};
for (const [cls, decl] of Object.entries(responsiveUtilities)) {
  const [prefix] = cls.split(':');
  grouped[prefix] ||= [];
  grouped[prefix].push(`.${escapeClassName(cls)}{${decl}}`);
}
for (const [prefix, rules] of Object.entries(grouped)) {
  css += `${breakpoints[prefix]}{${rules.join('')}}\n`;
}

const outFile = path.join(__dirname, '..', 'src', 'output.css');
fs.writeFileSync(outFile, css);
console.log(`Wrote ${outFile}`);
