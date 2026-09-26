// 自动生成：scripts/sync-miniprogram.mjs；来源 1.5.1 骨龄圆点修订。请勿手改。

/* 呼吸专区量表数据。
   与心理测试不同，这两份量表不是从个人网页迁移的，是本仓库直接录入的，
   来源与取证结论写在 reference/respiratory/ 与 DESIGN.md。

   两条硬约束，改动前先看清楚：
   1. ACT 的中文题干逐字取自呼吸病学分会哮喘学组《支气管哮喘防治指南（2024年版）》附表 2，
      不是自行翻译，也不要"顺手润色"。题干与选项保持指南原文的字符，
      中文与数字之间不加排版空格；第 1 题「在工作、学习或家中多少时候」比 2020 年版
      少了「，有」二字，期刊官方网站的原文就是如此，属实照抄，不要替它补字
      （出处全称见 reference/respiratory/README-取证与决定.md，本文件受过审措辞限制）。
   2. ePROVIDE 目录已确认 C-ACT 存在经语言学验证的 Chinese for China 版本，
      但本仓库尚未取得其授权全文与电子实现许可。本页因此只保证「结构、档位与分值」正确：
      题目位置放的是主题标签（名词短语，不是原表那句问句），孩子部分的选项文字是按
      英文原版档位写的中文说明，都不是官方中文版措辞；家长部分的天数档来自原版，属数据。
      在拿到版权方的官方中文版之前，不得用二手网页或自行翻译回填题干或选项。 */

const ACT_ITEM_OPTIONS = [
  [
    { value: 1, label: '所有时间' },
    { value: 2, label: '大多数时间' },
    { value: 3, label: '有些时间' },
    { value: 4, label: '极少时间' },
    { value: 5, label: '没有' }
  ],
  [
    { value: 1, label: '每天不止1次' },
    { value: 2, label: '每天1次' },
    { value: 3, label: '每周3~6次' },
    { value: 4, label: '每周1~2次' },
    { value: 5, label: '完全没有' }
  ],
  [
    { value: 1, label: '每周4个晚上或更多' },
    { value: 2, label: '每周2~3个晚上' },
    { value: 3, label: '每周1次' },
    { value: 4, label: '1~2次' },
    { value: 5, label: '没有' }
  ],
  [
    { value: 1, label: '每天3次以上' },
    { value: 2, label: '每天1~2次' },
    { value: 3, label: '每周2~3次' },
    { value: 4, label: '每周1次或更少' },
    { value: 5, label: '没有' }
  ],
  [
    { value: 1, label: '没有控制' },
    { value: 2, label: '控制很差' },
    { value: 3, label: '有所控制' },
    { value: 4, label: '良好控制' },
    { value: 5, label: '完全控制' }
  ]
];

/** C-ACT 儿童部分：4 级，纸质原表从左到右为 0→3，本页保持同一顺序，减少照抄出错。 */
const CACT_CHILD_QUALITY = [
  { value: 0, label: '很差' },
  { value: 1, label: '差' },
  { value: 2, label: '好' },
  { value: 3, label: '很好' }
];

const CACT_CHILD_PROBLEM = [
  { value: 0, label: '很大问题' },
  { value: 1, label: '有问题' },
  { value: 2, label: '有一点问题' },
  { value: 3, label: '没有问题' }
];

const CACT_CHILD_FREQUENCY = [
  { value: 0, label: '一直都是' },
  { value: 1, label: '大部分时间' },
  { value: 2, label: '有时' },
  { value: 3, label: '从来没有' }
];

/** C-ACT 家长部分：6 级天数，纸质原表从左到右为 5→0，本页保持同一顺序。 */
const CACT_PARENT_DAYS = [
  { value: 5, label: '完全没有' },
  { value: 4, label: '1~3 天' },
  { value: 3, label: '4~10 天' },
  { value: 2, label: '11~18 天' },
  { value: 1, label: '19~24 天' },
  { value: 0, label: '每天' }
];

const RESPIRATORY_DATA = {
  groups: [
    {
      key: 'control',
      label: '哮喘控制评估',
      hint: '按年龄选一个，评估的是控制水平',
      keys: ['cact', 'act']
    }
  ],

  scales: {
    cact: {
      code: 'C-ACT',
      title: '儿童哮喘控制测试',
      subtitle: '7 题 · 孩子 4 题 + 家长 3 题',
      group: 'respiratory',
      kind: '孩子作答 + 家长评定',
      agePill: '4–11 岁 · 孩子与家长一起完成',
      availability: '需配合正版原表计分',
      timeframe: '第 1 题看当天，第 5–7 题看最近 4 周',
      cardHint: '4–11 岁。需配合正版 C-ACT 原表；本页做结构化录入与 0–27 分计分。',
      lead: '儿童版哮喘控制测试。前 4 题请孩子自己选，后 3 题由家长独立填写，不要让孩子的答案影响家长的判断。',
      instruction: '本页不复制 C-ACT 的题干、选项措辞与表情图。题目位置只给主题标签，孩子部分的选项文字是按原表档位写的中文说明。请拿正版 C-ACT 原表逐题念题、按原表选项作答，再到本页点对应的档位完成计分。',
      notes: [
        'C-ACT 的著作权归 GSK，由 Mapi Research Trust 发行。ePROVIDE 目录已确认存在经语言学验证的 Chinese for China 版本，但本项目尚未取得其授权全文与电子实现许可。香港与台湾官方网页是另外的地区版本，不能繁转简替代大陆版。因此本页只保证结构、档位与分值正确：题目位置是主题标签，孩子部分的选项文字是按原表档位写的中文说明，都不是官方中文版措辞。念题与作答请以正版原表为准。',
        '这份量表评估的是哮喘控制水平，不是哮喘诊断工具。分数再低也不能据此诊断哮喘。',
        '前 4 题由孩子自己选答案；孩子读不懂时可以帮他读题，但不要替他选。第 5–7 题由家长独立完成。'
      ],
      sections: [
        { from: 1, title: '第一部分 · 由孩子作答', hint: '共 4 题，每题 4 个档位，顺序与纸质原表从左到右一致；选项文字是档位说明，不是原表措辞。' },
        { from: 5, title: '第二部分 · 由家长作答', hint: '共 3 题，回顾最近 4 周，每题 6 个天数档，天数区间与顺序与纸质原表一致。' }
      ],
      items: [
        '孩子今天的哮喘情况',
        '跑步、运动或做体育活动时，哮喘带来多大麻烦',
        '孩子因为哮喘咳嗽的情况',
        '孩子因为哮喘夜里醒来的情况',
        '最近 4 周，孩子出现白天哮喘症状的天数',
        '最近 4 周，孩子白天因哮喘喘息的天数',
        '最近 4 周，孩子夜里因哮喘醒来的天数'
      ],
      itemOptions: [
        CACT_CHILD_QUALITY,
        CACT_CHILD_PROBLEM,
        CACT_CHILD_FREQUENCY,
        CACT_CHILD_FREQUENCY,
        CACT_PARENT_DAYS,
        CACT_PARENT_DAYS,
        CACT_PARENT_DAYS
      ],
      options: CACT_CHILD_QUALITY,
      scoring: 'control',
      minScore: 0,
      maxScore: 27,
      positiveAtMost: 19,
      bands: [
        {
          max: 12,
          label: '哮喘控制很差',
          token: 'high',
          guidance: '总分 12 分及以下提示控制很差，建议尽快带孩子到呼吸专科复诊，重新评估用药方案与吸入装置使用情况。'
        },
        {
          max: 19,
          label: '哮喘控制不佳',
          token: 'moderate',
          guidance: '总分 19 分及以下提示控制不佳，建议带着这份结果找呼吸专科复诊，检查用药依从性、吸入方法与诱发因素。'
        },
        {
          max: 27,
          label: '哮喘控制可能良好',
          token: 'minimal',
          guidance: '总分 20 分及以上提示控制可能良好。控制良好不等于可以自行停药，用药调整请按专科随访计划执行。'
        }
      ],
      groups: [
        { label: '孩子部分（第 1–4 题）', items: [1, 2, 3, 4] },
        { label: '家长部分（第 5–7 题）', items: [5, 6, 7] }
      ],
      groupNote: '总分 = 孩子部分（0–12）+ 家长部分（0–15），范围 0–27，分数越高代表控制越好。儿科指南只给出「≤19 分控制不佳」这一条界线；「≤12 分控制很差」来自 Liu 等 2010 的后续验证，本页一并显示并在下方标注来源。',
      sources: [
        'C-ACT（Childhood Asthma Control Test）由 Liu AH 等编制，原始验证见 Liu AH 等，J Allergy Clin Immunol 2007;119(4):817-825；≤12 分作为「控制很差」的界值见 Liu AH 等，J Allergy Clin Immunol 2010;126(2):267-273。',
        '著作权：C-ACT Copyright © 2005 GSK. All Rights Reserved，由 Mapi Research Trust（ePROVIDE）发行。ePROVIDE 对电子实现要求 license agreement，并要求目标语言迁移与屏幕截图审核。本项目尚未完成这些步骤，因此不复制题干、选项措辞与表情图：题目位置是主题标签，孩子部分的选项文字是按原表档位写的中文说明，两者都不是官方中文版措辞；家长部分的天数区间取自原版。本页只保证结构、档位与分值正确。',
        '年龄与切点依据：儿科学分会呼吸学组等《儿童支气管哮喘诊断与防治指南（2025）》，中华儿科杂志 2025;63(4):324-337，表 4 列出 C-ACT 适用 4~11 岁、≤19 分控制不佳、变化≥3 分具有临床意义。',
        '分值范围口径差异：上述指南表 4 写作「5~27 分」，与原版的 0~27 分不一致。本页按原版 0~27 实现，因为孩子部分与家长部分的最低分本身就是 0。',
        'GINA 2026 只说明 C-ACT 可用于 4–11 岁儿童，未给出数值切点。'
      ]
    },

    act: {
      code: 'ACT',
      title: '哮喘控制测试',
      subtitle: '5 题 · 最近 4 周 · 本人作答',
      group: 'respiratory',
      kind: '本人自评',
      agePill: '12 岁及以上 · 本人作答',
      availability: '题目已完整',
      timeframe: '最近 4 周',
      cardHint: '12 岁及以上本人填写，5 题回顾最近 4 周，合计 5–25 分。',
      lead: '哮喘控制测试。5 题，回顾最近 4 周的活动受限、气促、夜间症状、急救用药与自我评价。',
      instruction: '请根据最近 4 周的实际情况作答，每题只选一项。',
      notes: [
        '这份量表评估的是哮喘控制水平，不是哮喘诊断工具。哮喘诊断需要结合反复喘息咳嗽等病史与肺功能等客观证据，分数再低也不能据此诊断。',
        '适用于 12 岁及以上本人填写。4–11 岁请改用 C-ACT。',
        '总分较上一次变化达到 3 分及以上，通常认为具有临床意义。'
      ],
      items: [
        '在过去4周内，在工作、学习或家中多少时候哮喘妨碍您进行日常活动？',
        '在过去4周内，您有多少次呼吸困难？',
        '在过去4周内，因为哮喘症状（喘息、咳嗽、呼吸困难、胸闷或疼痛），您有多少次在夜间醒来或早上比平时早醒？',
        '过去4周内，您有多少次使用急救药物治疗（如沙丁胺醇）？',
        '您如何评估过去4周内您的哮喘控制情况？'
      ],
      itemOptions: ACT_ITEM_OPTIONS,
      options: ACT_ITEM_OPTIONS[0],
      scoring: 'control',
      minScore: 5,
      maxScore: 25,
      positiveAtMost: 19,
      bands: [
        {
          max: 15,
          label: '哮喘控制很差',
          token: 'high',
          guidance: '总分 5~15 分代表控制很差，建议尽快到呼吸专科就诊，重新评估用药方案、吸入方法与诱发因素。'
        },
        {
          max: 19,
          label: '哮喘控制不佳',
          token: 'moderate',
          guidance: '总分 16~19 分代表控制不佳，建议带着这份结果与专业人员讨论，检查用药依从性与吸入装置使用情况。'
        },
        {
          max: 25,
          label: '哮喘控制良好',
          token: 'minimal',
          guidance: '总分 20~25 分代表控制良好。控制良好不等于可以自行停药或减量，调整请按随访计划执行。'
        }
      ],
      groupNote: '总分 = 5 题相加，范围 5–25，分数越高代表控制越好。分档口径：20~25 控制良好、16~19 控制不佳、5~15 控制很差。',
      sources: [
        '中文题干与选项逐字取自呼吸病学分会哮喘学组《支气管哮喘防治指南（2024年版）》附表 2「哮喘控制测试（ACT）问卷及其评分标准」，中华结核和呼吸杂志 2025;48(3):208-248。三档判读同出该附表的评分说明。',
        '原始开发与验证：Nathan RA 等，J Allergy Clin Immunol 2004;113(1):59-65；≤19 分切点的验证见 Schatz M 等，J Allergy Clin Immunol 2006;117(3):549-556（敏感度与特异度均约 71%）。',
        '著作权：Asthma Control Test 为 QualityMetric Incorporated 的注册商标，Copyright © 2002 QualityMetric Incorporated。官方使用手册写明非商业学术研究以外的使用需要事先取得授权。本页题干引自国家级指南附表，正式对外使用前请先确认授权状态。',
        '儿科口径参照：儿科学分会呼吸学组等《儿童支气管哮喘诊断与防治指南（2025）》，中华儿科杂志 2025;63(4):324-337，表 4 列出 ACT 适用 12 岁及以上、≤19 分控制不佳、变化≥3 分具有临床意义。',
        'GINA 2026 的分档与上述一致：20–25 well-controlled、16–19 not well-controlled、5–15 very poorly controlled，最小临床重要差值 3 分。'
      ]
    }
  }
};

export default RESPIRATORY_DATA;
