export const languages = ['zh', 'en'] as const
export type Language = typeof languages[number]
export const htmlLanguage = { zh: 'zh-CN', en: 'en' } as const
export function languagePrefix(language: Language): string { return language === 'en' ? 'en/' : '' }
export const ui = {
  zh: {
    skip: '跳到内容', home: 'Learn by Code 首页', nav: '主导航', topics: '主题目录',
    footer: '从机制到代码', motto: '可操作的图解，有出处的解释。',
    homeTitle: '把概念放进可操作的图里', homeDescription: '用交互图解和真实代码，理解复杂系统的工作方式。',
    eyebrow: '交互图解 / 真实源码 / 自己探索', heading1: '读懂代码之前，', heading2: '先看清它如何工作。',
    lead: '把抽象概念变成可操作的图。选一个事件，走一遍路径，再回到真实代码。',
    start: '从 Super-agent 的一条消息开始', learning: '学习方式',
    choose: '选择一个情境', observe: '观察机制变化', inspect: '对照实现依据',
    begin: '从这里开始', exploring: '正在探索的主题', count: '篇可交互讲解', countOne: '篇可交互讲解',
    topicsDescription: '按主题探索交互讲解，每一篇都对应具体机制与源码依据。',
    topicsHeading1: '一个主题，', topicsHeading2: '多条理解路径。',
    topicsLead: '每篇讲解回答一个具体问题。按顺序读，或从你关心的机制开始。',
    back: '← 主题目录', published: '可交互', planned: '计划中', minutes: '分钟', about: '约', verified: '源码核对于',
    boundary: '讲解基于公开研究原型。教学模拟与产品实际能力会分别标注；“计划中”内容尚未制作。',
    notFound: '页面未找到', notFoundDescription: '回到主题目录，继续探索。',
    notFoundHeading: '换一条路径继续。', notFoundLead: '这个页面可能已经移动，也可能尚未制作。', return: '返回主题目录',
  },
  en: {
    skip: 'Skip to content', home: 'Learn by Code home', nav: 'Main navigation', topics: 'Topics',
    footer: 'From mechanisms to code', motto: 'Interactive explanations, backed by sources.',
    homeTitle: 'Explore concepts through interactive diagrams', homeDescription: 'Understand complex systems with interactive diagrams and real source code.',
    eyebrow: 'Interactive diagrams / Real code / Your exploration', heading1: 'Before reading the code,', heading2: 'see how it works.',
    lead: 'Turn abstract concepts into diagrams you can operate. Choose an event, follow its path, then inspect the code.',
    start: 'Start with one Super-agent message', learning: 'How to explore',
    choose: 'Choose a scenario', observe: 'Watch the mechanism', inspect: 'Inspect the source',
    begin: 'Start here', exploring: 'Topics to explore', count: 'interactive lessons', countOne: 'interactive lesson',
    topicsDescription: 'Explore lessons by topic. Each lesson connects a mechanism to real source code.',
    topicsHeading1: 'One topic,', topicsHeading2: 'several ways to understand.',
    topicsLead: 'Each lesson answers one concrete question. Follow the sequence or start with the mechanism you care about.',
    back: '← Topics', published: 'Interactive', planned: 'Planned', minutes: 'min', about: 'About', verified: 'Source checked',
    boundary: 'Lessons use a public research prototype. Teaching simulations and implemented capabilities are marked separately. Planned lessons are not available yet.',
    notFound: 'Page not found', notFoundDescription: 'Return to topics and keep exploring.',
    notFoundHeading: 'Take another path.', notFoundLead: 'This page may have moved, or it may not exist yet.', return: 'Return to topics',
  },
} as const
