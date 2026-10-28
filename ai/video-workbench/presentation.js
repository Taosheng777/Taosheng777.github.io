// 展示文案与原始目录分开维护，保留条目 ID、固定出处和收藏。
window.VIDEO_PRESENTATION = {
  items: {
    'motion:huashu-motion-launch': {name:'把一个工具介绍清楚', description:'把操作过程、功能亮点和最终成果剪成一支完整的产品介绍片。', useCase:'产品介绍、功能发布'},
    'motion:huashu-design-launch': {name:'同一内容，换着画风展示', description:'文字保持不动，背后的设计案例跟着节拍切换，直观看到不同风格。', useCase:'设计作品集、品牌展示'},
    'motion:deepseek-v4.1-flash-specimen': {name:'用文字与图形做发布片', description:'以 DeepSeek 为题，把品牌图形、短句与快切镜头编排成一支短片。', useCase:'工具发布、短片开场'},
    'motion:grok-bot-fan-film': {name:'把 AI 助手的工作拍成故事', description:'从夜间协作讲到清晨汇报，用界面画面解释助手怎样帮忙。Grok 主题同人作品。', useCase:'AI 助手、服务流程'},
    'motion:claude-duet-fan-film-en': {name:'用像素角色讲产品变化', description:'让像素角色在画面里行动，把功能变化串成一个故事。Claude 主题同人作品。', useCase:'趣味产品介绍、角色故事'},
    'motion:direction-cursor-demo': {name:'跟着鼠标学操作', description:'点哪里、填什么、结果在哪，镜头跟着操作一步步走。', useCase:'软件教程、AI 工作流', group:'演示功能'},
    'motion:direction-continuous-morph': {name:'一个形状，接着变', description:'按钮变成卡片，卡片再变成图表，让几个画面自然接上。', useCase:'功能衔接、流畅转场', group:'营造画面风格', related:'mg:08-morph'},
    'motion:direction-card-montage': {name:'把成果一张张亮出来', description:'把截图和成品排成卡片，跟着节奏依次展示。', useCase:'作品集、成果汇报', group:'演示功能'},
    'motion:direction-kinetic-type': {name:'让关键词跟着声音出现', description:'讲到哪个重点，哪个词或数字就进入画面。', useCase:'片头、金句、要点清单', group:'讲清知识', related:'grammar:y5_kinetic_type'},
    'motion:direction-modular-grid': {name:'把多个功能排清楚', description:'功能、参数各占一个格子，通过移动和放大突出当前重点。', useCase:'多功能工具、参数介绍', group:'演示功能', related:'grammar:t2_keynote_ui'},
    'motion:direction-data-story': {name:'让数字和图表动起来', description:'柱子升高、曲线延伸，让观众顺着变化看懂数据。', useCase:'研究结果、数据对比', group:'讲清知识', related:'grammar:t3_finance_chart'},
    'motion:direction-mechanism': {name:'一步步讲清为什么', description:'让同一个对象连续变化，把原因、过程和结果接起来。', useCase:'科学原理、医学机制', group:'讲清知识'},
    'motion:direction-system-diagram': {name:'把流程和关系连起来', description:'用节点和连线讲清谁与谁相关、信息怎样流动。', useCase:'服务流程、AI 协作', group:'演示功能'},
    'motion:direction-flat-world': {name:'从全景一路看到细节', description:'镜头从大场景推到小结构，让观众看懂不同层级的关系。', useCase:'健康科普、知识教学', group:'讲清知识', related:'grammar:y1_kurzgesagt'},
    'motion:direction-editorial-collage': {name:'边展示资料，边标重点', description:'把真实截图和资料放进画面，讲到哪里就圈出哪里。', useCase:'新闻解读、证据讲解', group:'讲清知识', related:'grammar:y2_vox'},
    'motion:direction-hand-drawn': {name:'像在白板上一边画一边讲', description:'线条和图形随讲解逐步出现，最后组成完整画面。', useCase:'教学、亲切的科普', group:'讲清知识', related:'grammar:y3_whiteboard'},
    'motion:direction-character': {name:'用角色的行动推进故事', description:'让角色遇到问题、作出反应，再用行动带出下一幕。', useCase:'成长故事、情绪表达', group:'讲述故事'},
    'motion:direction-3d-object': {name:'把物体转过来、拆开看', description:'围着一个物体运镜，用旋转、组装和拆解展示细节。', useCase:'器械、硬件、结构说明', group:'演示功能', related:'mg:04-3d-render'},
    'motion:direction-generative-field': {name:'用粒子和流动做片头', description:'让粒子、轨迹和抽象形态跟着节奏变化。', useCase:'科技片头、音乐画面', group:'营造画面风格'},
    'motion:direction-liquid-glass': {name:'让界面像玻璃一样流动', description:'用透明、折射和柔软的变形，让界面显得轻盈。', useCase:'应用展示、品牌短片', group:'营造画面风格'},
    'motion:direction-photo-led': {name:'用真实照片讲故事', description:'把人物、照片和真实场景作为主体，用剪辑组织内容。', useCase:'活动记录、机构介绍', group:'讲述故事'},
    'motion:direction-showreel': {name:'跟着节奏快速切换画面', description:'把最有表现力的几个镜头剪在一起，迅速展示亮点。', useCase:'作品集、预告、开场', group:'营造画面风格'},
    'motion:direction-retro-digital': {name:'做成老游戏或旧电脑的样子', description:'用像素画面、终端文字和跳动的数字营造复古感。', useCase:'游戏主题、趣味片头', group:'营造画面风格'},
    'motion:direction-art-styles': {name:'让画面穿过不同艺术风格', description:'让场景在油画、水彩或其他画风之间切换。', useCase:'艺术主题、风格展示', group:'营造画面风格'},
    'motion:direction-talking-head': {name:'人来讲，图文在旁边帮忙', description:'保留真人讲解，在需要时加入关键词、图片和示意。', useCase:'专家讲解、人物介绍', group:'讲述故事'},
    'showcase:mario-claude': {name:'顶砖块，选道具', description:'角色进入像素关卡，顶开砖块、选择道具，再变大。', useCase:'把选择过程讲成故事', group:'像素游戏里的小冒险'},
    'showcase:mario-combo': {name:'踩敌人、踢球、撞砖块', description:'连续几个动作一气呵成，看角色怎样推动画面往前走。', useCase:'连续动作、轻松的节奏', group:'像素游戏里的小冒险'},
    'showcase:mario-pipe': {name:'钻进水管，换一个场景', description:'角色钻进水管，镜头穿过隧道进入金币密室，再回到地面。', useCase:'用行动连接两个场景', group:'像素游戏里的小冒险'},
    'showcase:clawd-vangogh': {name:'跳进梵高的画里', description:'Clawd 跳进画框，变成厚涂笔触的角色，在麦田里奔跑。', useCase:'让角色融入名画风格', group:'博物馆里的一夜'},
    'showcase:clawd-trex': {name:'恐龙骨架追着光跑', description:'手电光斑一移动，霸王龙骨架就扑过去，像猫追激光点。', useCase:'用一个小动作制造趣味', group:'博物馆里的一夜'},
    'showcase:clawd-dawn': {name:'天亮了，装成展品', description:'保安回来时，角色躲进画框装作展品，最后偷偷眨一下眼。', useCase:'用停顿和小反应收尾', group:'博物馆里的一夜'},
    'showcase:monet': {name:'在莫奈的池塘打水漂', description:'石子落进水面，涟漪在日本桥前一圈圈展开。', useCase:'让静态名画里的局部动起来', group:'走进三种不同的画风'},
    'showcase:egypt': {name:'走进埃及壁画', description:'角色进入古埃及壁画，与圣甲虫互动。', useCase:'切换画风后保持角色连贯', group:'走进三种不同的画风'},
    'showcase:pixel': {name:'变成像素，顶出金币', description:'角色进入 8-bit 游戏画面，顶开方块，让金币跳出来。', useCase:'把同一角色放进不同世界', group:'走进三种不同的画风'}
  },
  stories: [
    {name:'像素游戏里的小冒险', description:'把产品选择、连续动作和场景切换，放进一个熟悉的游戏世界。'},
    {name:'博物馆里的一夜', description:'跟着一个角色跑进名画、躲开恐龙，再用一个小反应结束故事。'},
    {name:'走进三种不同的画风', description:'同一个主角进入莫奈、埃及壁画和像素世界，观察画风怎样改变。'}
  ]
};
