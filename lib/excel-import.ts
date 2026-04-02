import type { KeyResult, Objective, Personnel } from "@/lib/data";
import { createId, parseWeight } from "@/lib/utils";

type SheetRow = Array<string | number | null | undefined>;
export type ExcelSheetPreview = {
  sheetName: string;
  rows: string[][];
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function collectNamesFromText(content: string) {
  return Array.from(new Set((content.match(/@([\u4e00-\u9fa5A-Za-z0-9·]+)/g) ?? []).map((item) => item.replace("@", ""))));
}

function parseNamedBlock(content: string, label: string) {
  const match = content.match(new RegExp(`${label}[：:]\\s*([^\\n]+)`));
  if (!match) {
    return [];
  }

  return match[1]
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => name.replace(/^@/, ""));
}

export function parsePersonnelFromText(target2026: string, budgetStr: string): Personnel[] {
  const people: Personnel[] = [];
  const add = (name: string, role: Personnel["role"]) => {
    const normalized = name.trim().replace(/^@/, "");
    if (!normalized) {
      return;
    }

    if (!people.some((person) => person.name === normalized && person.role === role)) {
      people.push({ name: normalized, role });
    }
  };

  parseNamedBlock(budgetStr, "组长").forEach((name) => add(name, "组长"));
  parseNamedBlock(budgetStr, "副组长").forEach((name) => add(name, "组长"));
  parseNamedBlock(budgetStr, "组员").forEach((name) => add(name, "组员"));
  parseNamedBlock(budgetStr, "业务对接").forEach((name) => add(name, "业务对接"));
  parseNamedBlock(budgetStr, "公关组").forEach((name) => add(name, "公关组"));

  [...collectNamesFromText(target2026), ...collectNamesFromText(budgetStr)].forEach((name) => {
    if (!people.some((person) => person.name === name)) {
      add(name, "组员");
    }
  });

  return people;
}

export function inferCompletionFromProgress(progress: string) {
  const percent = progress.match(/(\d{1,3})\s*%/);
  if (percent) {
    return Math.max(0, Math.min(100, Number(percent[1])));
  }

  if (!progress) {
    return 0;
  }

  if (progress.includes("暂无") || progress.includes("无进度")) {
    return 0;
  }

  return 20;
}

export async function readExcelPreview(
  file: File,
  {
    maxSheets = 3,
    maxRows = 60,
    maxCols = 18
  }: {
    maxSheets?: number;
    maxRows?: number;
    maxCols?: number;
  } = {}
) {
  const XLSX = (await import("xlsx")) as any;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  return workbook.SheetNames.slice(0, maxSheets).map((sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: ""
    }) as SheetRow[];

    return {
      sheetName,
      rows: rows
        .slice(0, maxRows)
        .map((row) => row.slice(0, maxCols).map((cell) => text(cell)))
        .filter((row) => row.some(Boolean))
    } satisfies ExcelSheetPreview;
  });
}

export async function parseObjectivesFromExcel(file: File) {
  const XLSX = (await import("xlsx")) as any;
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    raw: false,
    defval: ""
  }) as SheetRow[];

  const headerRowIndex = rows.findIndex((row: SheetRow) => row.some((cell: unknown) => text(cell).includes("O 目标")));
  if (headerRowIndex === -1) {
    throw new Error("没有识别到 OKR 模板表头，请确认导入的是原始模板。");
  }

  const header = rows[headerRowIndex].map((cell: unknown) => text(cell));
  const findCol = (keyword: string) => header.findIndex((cell) => cell.includes(keyword));

  const departmentCol = findCol("部门");
  const ownerCol = findCol("负责人");
  const objectiveCol = findCol("O 目标");
  const docCol = findCol("补充文档");
  const objectiveWeightCol = findCol("O 权重");
  const krCol = findCol("KR 关键成果");
  const krWeightCol = findCol("KR 权重");
  const typeCol = findCol("目标类型");
  const targetCol = findCol("2026年目标值");
  const budgetCol = findCol("预算和人员");
  const progressCol = findCol("3月进度");
  const metricCol = findCol("指标定义");
  const dataProviderCol = findCol("数据提供部门");
  const interfaceCol = findCol("数据接口人");
  const alignDeptCol = findCol("我对齐的部门");
  const alignOkrCol = findCol("我对齐的OKR");

  const objectives: Objective[] = [];
  let currentObjective: Objective | null = null;

  rows.slice(headerRowIndex + 1).forEach((row: SheetRow) => {
    const objectiveTitle = text(row[objectiveCol]);
    const krTitle = text(row[krCol]);

    if (!objectiveTitle && !krTitle) {
      return;
    }

    if (objectiveTitle) {
      currentObjective = {
        id: createId("o"),
        title: objectiveTitle,
        weight: parseWeight(text(row[objectiveWeightCol])),
        owner: text(row[ownerCol]),
        department: text(row[departmentCol]),
        docLink: text(row[docCol]) || undefined,
        krs: []
      };
      objectives.push(currentObjective);
    }

    if (!currentObjective || !krTitle) {
      return;
    }

    const target2026 = text(row[targetCol]);
    const budgetStr = text(row[budgetCol]);
    const progress = text(row[progressCol]);

    currentObjective.krs.push({
      id: createId("kr"),
      title: krTitle,
      weight: parseWeight(text(row[krWeightCol])),
      type: text(row[typeCol]).includes("探索") ? "探索型" : "承诺型",
      target2026,
      progress,
      budgetStr,
      personnel: parsePersonnelFromText(target2026, budgetStr),
      metricDefinition: text(row[metricCol]),
      marchProgressLabel: "3 月进度",
      completion: inferCompletionFromProgress(progress),
      dataProvider: text(row[dataProviderCol]) || undefined,
      interfacePerson: text(row[interfaceCol]) || undefined,
      alignedDepartments: text(row[alignDeptCol]) || undefined,
      alignedOkr: text(row[alignOkrCol]) || undefined
    });
  });

  if (objectives.length === 0) {
    throw new Error("Excel 中没有识别到任何 Objective。");
  }

  return objectives;
}
