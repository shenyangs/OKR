export type Personnel = {
  name: string;
  role: "组长" | "组员" | "业务对接" | "公关组";
};

export type KeyResult = {
  id: string;
  title: string;
  weight: number;
  type: "承诺型" | "探索型";
  target2026: string;
  progress: string;
  budgetStr: string;
  personnel: Personnel[];
  metricDefinition: string;
  marchProgressLabel: string;
  completion: number;
  dataProvider?: string;
  interfacePerson?: string;
  alignedDepartments?: string;
  alignedOkr?: string;
};

export type Objective = {
  id: string;
  title: string;
  weight: number;
  owner: string;
  department: string;
  docLink?: string;
  krs: KeyResult[];
};

export const personnelRoster = [
  "崔木杨",
  "甄紫涵",
  "冯雨",
  "沈旸",
  "何轶谦",
  "陈启铭",
  "郭本洋",
  "常俊杰",
  "陈伯垚",
  "刘晓天",
  "刘一钊",
  "庚玉静",
  "李悦",
  "车凯",
  "胡泉",
  "刘杭",
  "刘璐璐",
  "张媛媛",
  "巴文敏",
  "耿富敏",
  "马松鹤",
  "毛慧东",
  "秦鹏飞",
  "梁人懿",
  "王磊",
  "关晓",
  "张润慧",
  "刘依琳",
  "张玲",
  "刘雨萱",
  "操梦平"
];

export const initialObjectives: Objective[] = [
  {
    id: "o1",
    title: "O1：金山办公 WPS 整个品牌影响力提升（AI 办公应用的先锋）",
    weight: 0.2,
    owner: "崔木杨",
    department: "品牌管理组",
    krs: [
      {
        id: "o1-kr1",
        title: "KR1：建立面向公众的顶级品牌感知力",
        weight: 0.3,
        type: "探索型",
        target2026:
          "与春晚、奥运、世界杯、F1、马拉松等顶级 IP 形成全年 4 次合作或借势；与超级个人/机构 IP 完成 4 次联名合作；围绕 WPS 产品能力打造 1 个全国级世界级活动，并推动春芽计划形成 12 次可复用活动，同时探索 4 次创新品牌传播方式。",
        progress:
          "已有顶级 IP 合作尚无实质进度；WPS AI 全能生产力大赛方案已启动撰写；春芽计划省部级合作暂未进入执行；短剧与 AI 创新传播进入方向摸索阶段。",
        budgetStr:
          "预算项目制，单独申报，不设上限。组长：甄紫涵。组员：冯雨、沈旸、陈启铭、常俊杰、陈伯垚、刘晓天、刘一钊、庚玉静。",
        personnel: [
          { name: "甄紫涵", role: "组长" },
          { name: "冯雨", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "陈启铭", role: "组员" },
          { name: "常俊杰", role: "组员" },
          { name: "陈伯垚", role: "组员" },
          { name: "刘晓天", role: "组员" },
          { name: "刘一钊", role: "组员" },
          { name: "庚玉静", role: "组员" }
        ],
        metricDefinition:
          "核心看四组指标：顶级 IP 合作次数、超级 IP 联名次数、全国性自有 IP 活动数量、春芽计划复用活动次数。判断标准不是单次曝光，而是是否形成公众可感知的品牌记忆点。",
        marchProgressLabel: "3 月进度",
        completion: 18,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o1-kr2",
        title: "KR2：树立良好的企业社会责任形象，建设公众对 WPS 已成为 AI 办公先锋公司的认知",
        weight: 0.4,
        type: "承诺型",
        target2026:
          "围绕“用户第一”和“技术立业”两条主叙事，建立快速反应体系，全年完成活动化传播与品牌故事化传播两大路径，持续强化 WPS 既有温度又有技术厚度的社会心智。",
        progress:
          "当前尚处于策略整理阶段，3 月重点在于把用户视角与技术投入两条叙事梳理为全年可复制的传播母版。",
        budgetStr:
          "活动化传播预算约 300 万/年；品牌故事化传播预算约 300 万/年。组长：何轶谦。公关组核心协同：冯雨、沈旸。",
        personnel: [
          { name: "何轶谦", role: "组长" },
          { name: "冯雨", role: "公关组" },
          { name: "沈旸", role: "公关组" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "以全年活动化传播次数、品牌故事化内容产出次数、微信生态传播表现和受众互动质量为主。重点不是单条稿件，而是长期有效的社会好感度与 AI 先锋认知。",
        marchProgressLabel: "3 月进度",
        completion: 12,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o1-kr3",
        title: "KR3：逐步建立 WPS 海外影响力，为全球一流办公品牌储备能力",
        weight: 0.3,
        type: "承诺型",
        target2026:
          "以东南亚为核心建立海外媒体、自媒体、社交平台传播体系，直链媒体超过 50 家，全年海外传播不低于 12 次，海外用户故事不低于 20 个，并完成不少于 6 场线上市场活动。",
        progress:
          "3 月已完成 10 家东南亚重点传播供应商洽谈、比价与方案打磨；围绕国际版 Office 发布与 Gitex B 端展会，已进入传播方案沟通阶段。",
        budgetStr:
          "组长：冯雨。组员：梁人懿、王磊。海外媒体矩阵、客户故事、KOL 与线上活动合计预算约 420 万元，另含国内出海认知建设预算约 80 万元。",
        personnel: [
          { name: "冯雨", role: "组长" },
          { name: "梁人懿", role: "组员" },
          { name: "王磊", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "衡量口径覆盖媒体建联数量、单次传播成本、全年海外传播次数、客户故事数、活动场次以及国内出海认知建设效果。需要同时看渠道建设与海外品牌心智沉淀。",
        marchProgressLabel: "3 月进度",
        completion: 28,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      }
    ]
  },
  {
    id: "o2",
    title: "O2：WPS 365 在 AI 协同办公领域建立一线品牌心智",
    weight: 0.3,
    owner: "崔木杨",
    department: "品牌管理组",
    krs: [
      {
        id: "o2-kr1",
        title: "KR1：抢差异化心智，打造企业级 AI 办公第一品牌认知",
        weight: 0.2,
        type: "承诺型",
        target2026:
          "通过顶级机构、第三方榜单、客户故事与白皮书，系统性定义 WPS 365 的行业领先性、前瞻性与颠覆性，全年客户故事 50 个，CXO 级案例不少于 5 个，全年独立选题传播不低于 30 次。",
        progress:
          "IDC 分析师沟通已完成，可定制报告；客户故事新增山东大学、华为、温氏等 3 个已完成案例，另有多个行业案例推进中；公关侧已在两会报道中完成党央媒体突破。",
        budgetStr:
          "组长：甄紫涵，副组长：冯雨。组员：郭本洋、李悦、车凯、胡泉、何轶谦、刘杭、沈旸、耿富敏。预算项目制，单独申报。",
        personnel: [
          { name: "甄紫涵", role: "组长" },
          { name: "冯雨", role: "组员" },
          { name: "郭本洋", role: "组员" },
          { name: "李悦", role: "组员" },
          { name: "车凯", role: "组员" },
          { name: "胡泉", role: "组员" },
          { name: "何轶谦", role: "组员" },
          { name: "刘杭", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "耿富敏", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "重点追踪第三方权威背书数量、客户故事数量、CXO 级案例占比、独立选题传播次数和全网声量。该 KR 的价值在于建立行业断言，而不仅是常规品牌曝光。",
        marchProgressLabel: "3 月进度",
        completion: 34,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o2-kr2",
        title: "KR2：抢城市，建立产品发布会到城市大会再到行业峰会的三级渗透体系",
        weight: 0.3,
        type: "承诺型",
        target2026:
          "保持 WPS 365 在教育行业品牌力绝对领先，全年教育行业宣推活动不低于 20 场；举办穹顶之上 AI 办公生产力大会；围绕重点区域形成分层渗透传播。",
        progress:
          "320 深圳峰会、326 企业渠道大会已推进执行；春芽计划已进入 4 月落地准备；414 成都峰会将作为数据三部曲中的重点事件继续推进。",
        budgetStr:
          "组长：甄紫涵。组员：张媛媛、车凯、冯雨、沈旸、刘璐璐、常俊杰、毛慧东、秦鹏飞、陈伯垚、刘晓天。预算项目制，单独申报。",
        personnel: [
          { name: "甄紫涵", role: "组长" },
          { name: "张媛媛", role: "组员" },
          { name: "车凯", role: "组员" },
          { name: "冯雨", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "刘璐璐", role: "组员" },
          { name: "常俊杰", role: "组员" },
          { name: "毛慧东", role: "组员" },
          { name: "秦鹏飞", role: "组员" },
          { name: "陈伯垚", role: "组员" },
          { name: "刘晓天", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "以教育与重点城市活动场次、大会声量、重点城市季度覆盖度和总声量为主。该 KR 的本质是把品牌断言变成线下与区域渗透的持续触点。",
        marchProgressLabel: "3 月进度",
        completion: 42,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o2-kr3",
        title: "KR3：围绕 365 核心优势，以微信为重点战场提升重点人群感知",
        weight: 0.4,
        type: "承诺型",
        target2026:
          "微信指数日均达到 100 万；微信声量从 4792 提升至 5 万，并使微信声量占全平台声量的 40%；微信内容体系中同时出现飞钉 365 的内容从 161 篇提升到 1610 篇。",
        progress:
          "2 月 24 日开工至今一个月，微信指数平均约 17.4 万；近 7 天高位约 31.9 万，整体开始爬升，但与飞书、钉钉的强势节点相比仍需更多爆点支撑。",
        budgetStr:
          "组长：甄紫涵。组员：冯雨、沈旸、刘璐璐、刘一钊、巴文敏、马松鹤、刘晓天、陈伯垚、常俊杰、操梦平。预算重点投向官号、微信生态爆款与媒体/自媒体/UGC 体系。",
        personnel: [
          { name: "甄紫涵", role: "组长" },
          { name: "冯雨", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "刘璐璐", role: "组员" },
          { name: "刘一钊", role: "组员" },
          { name: "巴文敏", role: "组员" },
          { name: "马松鹤", role: "组员" },
          { name: "刘晓天", role: "组员" },
          { name: "陈伯垚", role: "组员" },
          { name: "常俊杰", role: "组员" },
          { name: "操梦平", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "需要同时看微信指数、微信声量、微信内容渗透率和全平台声量结构。这个 KR 不是单个平台冲量，而是让微信生态成为 365 品牌心智的主阵地。",
        marchProgressLabel: "3 月进度",
        completion: 22,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      }
    ]
  },
  {
    id: "o3",
    title: "O3：树立 WPS AI 办公产品影响力",
    weight: 0.1,
    owner: "崔木杨",
    department: "品牌管理组",
    krs: [
      {
        id: "o3-kr1",
        title: "KR1：抢认知，打造“人人都有 AI 助理”的广泛认知",
        weight: 0.7,
        type: "承诺型",
        target2026:
          "全年举办不低于 10 场面向媒体、自媒体、用户和产品经理的交流会，沉淀不少于 20 个用户故事，并通过市场联名活动强化对 AI 办公基础设施建设使命的认知。",
        progress:
          "LV 苹果生态大会活动推进中；正在筹备 iPad 桌面版粉丝运营活动、论文季进北大、多维表格新品沟通会；品牌市场联动暂未形成实质突破。",
        budgetStr:
          "组长：陈启铭。组员：关晓、张润慧、刘依琳、马松鹤、沈旸、张玲、耿富敏。",
        personnel: [
          { name: "陈启铭", role: "组长" },
          { name: "关晓", role: "组员" },
          { name: "张润慧", role: "组员" },
          { name: "刘依琳", role: "组员" },
          { name: "马松鹤", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "张玲", role: "组员" },
          { name: "耿富敏", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "围绕活动场次、用户故事数量、重点联名次数和 AI 圈层认知建设效果来衡量。重点是让产品影响力从单点宣传转成可扩散的用户心智。",
        marchProgressLabel: "3 月进度",
        completion: 38,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o3-kr2",
        title: "KR2：抢 IP，抢占 AI 舆论场制高点并沉淀品牌美誉度",
        weight: 0.3,
        type: "承诺型",
        target2026:
          "全年一流榜单不少于 15 次、白皮书 1 次，AI 声量达到 42 万，美誉度 NPS 与 NSR 实现 20% 提升，并完成三级品宣体系搭建。",
        progress:
          "榜单方向暂无明显推进；3 月整体 AI 声量约 2.5 万，同比去年下降 16.7%，主要受热点产品承接不足与 iPad 桌面版自发传播对 AI 覆盖率有限影响。",
        budgetStr: "组长：陈启铭。组员：李悦、刘雨萱。",
        personnel: [
          { name: "陈启铭", role: "组长" },
          { name: "李悦", role: "组员" },
          { name: "刘雨萱", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "衡量标准包括榜单与白皮书产出、AI 声量总量、品牌美誉度指标和三级品宣体系成熟度。这个 KR 的关键是拿下制高点资源，而不是均匀铺量。",
        marchProgressLabel: "3 月进度",
        completion: 16,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      }
    ]
  },
  {
    id: "o4",
    title: "O4：严守舆情底线，建立从中央到地方再到行业的三级媒体老铁体系",
    weight: 0.2,
    owner: "崔木杨",
    department: "品牌管理组",
    krs: [
      {
        id: "o4-kr1",
        title: "KR1：党央媒与头部大 V 关系构建",
        weight: 0.4,
        type: "承诺型",
        target2026:
          "围绕国产办公软件探索者、新协同、AI 办公三条议题，全年产出 30 篇高质量稿件，保持至少每月一次访谈，并形成可追溯访谈记录。",
        progress:
          "3 月已产出 1 篇科技日报稿件；当前待解决重点是央媒沟通从商务销售模式转向采编对接，同时推进 4 月三大央媒总编辑拜访与央视选题落地。",
        budgetStr: "组长：冯雨。组员：刘杭。",
        personnel: [
          { name: "冯雨", role: "组长" },
          { name: "沈旸", role: "组员" },
          { name: "刘杭", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "不仅看稿件数量，还看访谈频次、央媒关系质量、采编直连能力以及重点议题的稳定输出能力。这是舆情安全和品牌权威感的底盘建设。",
        marchProgressLabel: "3 月进度",
        completion: 25,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o4-kr2",
        title: "KR2：地方头部媒体与地方大 V 关系构建",
        weight: 0.3,
        type: "承诺型",
        target2026:
          "以大区为核心构建区域媒体矩阵，全年地域媒体 B 级选题不少于 180 个；全年举办 12 场总编辑进金山研讨会；重点区域活动承办不少于 20 场。",
        progress:
          "3 月区域媒介 B 级工作量已统计：华北 5 个、华东 7 个、华中西 4 个；同时海外传播基建的供应商打磨与国际版 Office 传播方案也在并行推进。",
        budgetStr:
          "组长：郭本洋。区域媒体交流活动预算约 50 万元，全年以媒体茶话会、业务沙龙、媒体客户走访等形式推进。",
        personnel: [
          { name: "郭本洋", role: "组长" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "以地域媒体 B 级选题量、总编辑进金山场次、重点区域活动承办数和区域媒体矩阵完整度为主。这个 KR 的核心是让传播能力真正落到各区域。",
        marchProgressLabel: "3 月进度",
        completion: 30,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o4-kr3",
        title: "KR3：舆情监控与社交平台运营",
        weight: 0.3,
        type: "承诺型",
        target2026:
          "实现主流媒体和社交平台 24 小时内监控、拦截与处理舆情，培养可积淀、可运营的自媒体与 UGC 资产，并抢占微信与小红书办公赛道话语权。",
        progress:
          "3 月已完成新浪财经负面稿件快速处理，并联动产品、技术、客服化解 315 前夕潜在风险。总体说明处置链路已跑通，但仍需更系统的预判机制。",
        budgetStr:
          "组长：崔木杨。组员：冯雨、沈旸。要求党央媒、核心财经媒体、核心地方媒体和知名行业自媒体不得出现原生重大负面，负面热搜需在 5 小时内处置。",
        personnel: [
          { name: "崔木杨", role: "组长" },
          { name: "冯雨", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "庚玉静", role: "业务对接" }
        ],
        metricDefinition:
          "关注响应时效、处置成功率、重大负面控制情况与自媒体资产沉淀。它既是风险管理指标，也是长期内容阵地建设指标。",
        marchProgressLabel: "3 月进度",
        completion: 48,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      }
    ]
  },
  {
    id: "o5",
    title: "O5：打造 AI 时代下的新型品牌部",
    weight: 0.2,
    owner: "崔木杨",
    department: "品牌管理组",
    krs: [
      {
        id: "o5-kr1",
        title: "KR1：构建 AI 内容与创意生产体系，提升品牌市场协同效率",
        weight: 0.5,
        type: "承诺型",
        target2026:
          "4 月完成品牌市场 AI 工具平台选型与搭建，实现核心工作场景覆盖；形成每月专项实操培训计划；完成核心工作流程的 AI 化改造与辅助审核机制；建立 AI 驱动的目标管理及人才培养体系，部门 OKR 达成率不低于 90%。",
        progress: "此项为新增 OKR，3 月暂无实质进展，当前处于目标与方案搭建阶段。",
        budgetStr:
          "预算根据 AI 工具实际价格申请。组长：甄紫涵。组员：冯雨、陈启铭、沈旸、常俊杰、刘一钊、巴文敏、何轶谦、庚玉静、张媛媛、车凯、操梦平。",
        personnel: [
          { name: "甄紫涵", role: "组长" },
          { name: "冯雨", role: "组员" },
          { name: "陈启铭", role: "组员" },
          { name: "沈旸", role: "组员" },
          { name: "常俊杰", role: "组员" },
          { name: "刘一钊", role: "组员" },
          { name: "巴文敏", role: "组员" },
          { name: "何轶谦", role: "组员" },
          { name: "庚玉静", role: "组员" },
          { name: "张媛媛", role: "组员" },
          { name: "车凯", role: "组员" },
          { name: "操梦平", role: "组员" }
        ],
        metricDefinition:
          "这是一条组织能力 KR。看平台落地、工具覆盖率、培训通过率、流程 AI 化完成度和部门 OKR 达成率，不是单一传播数字，而是人效和协同效率的结构性提升。",
        marchProgressLabel: "3 月进度",
        completion: 8,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      },
      {
        id: "o5-kr2",
        title: "KR2：构建基于媒体、自媒体、UGC 的渠道运营体系，大力提升渠道性价比",
        weight: 0.5,
        type: "探索型",
        target2026:
          "完成媒体、自媒体、UGC 三类渠道的运营标准与分工机制落地，建立全渠道数据追踪与效果评估模型，并实现核心渠道投入产出比或单位获客成本同比优化不低于 15%。",
        progress: "此项为新增 OKR，3 月暂无进展，当前仍在梳理分工机制与 ROI 评估模型。",
        budgetStr:
          "双组长机制：冯雨、沈旸。组员：耿富敏。目标投放比达到同类型渠道 1:3。",
        personnel: [
          { name: "冯雨", role: "组长" },
          { name: "沈旸", role: "组长" },
          { name: "耿富敏", role: "组员" }
        ],
        metricDefinition:
          "衡量口径包括渠道标准化程度、数据追踪完整度、ROI、单位获客成本与渠道结构优化效果。它属于探索型，但最终要形成可复用的方法论和可验证的效率结果。",
        marchProgressLabel: "3 月进度",
        completion: 6,
        dataProvider: "品牌管理组",
        interfacePerson: "庚玉静"
      }
    ]
  }
];

export const objectives = initialObjectives;
