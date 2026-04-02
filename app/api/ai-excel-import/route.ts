import { NextResponse } from "next/server";
import { callMiniMaxJson } from "@/lib/ai-minimax";
import { sanitizeExcelImportResult, type AiExcelImportResult } from "@/lib/ai-okr";
import type { ExcelSheetPreview } from "@/lib/excel-import";

type AiExcelImportRequest = {
  fileName?: string;
  sheets?: ExcelSheetPreview[];
};

type RawExcelImportResult = {
  summary?: unknown;
  warnings?: unknown;
  objectives?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiExcelImportRequest;
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const sheets = Array.isArray(body.sheets)
      ? body.sheets
          .map((sheet) => ({
            sheetName: typeof sheet?.sheetName === "string" ? sheet.sheetName.trim() : "Sheet",
            rows: Array.isArray(sheet?.rows)
              ? sheet.rows
                  .filter((row) => Array.isArray(row))
                  .map((row) =>
                    row
                      .slice(0, 18)
                      .map((cell) => String(cell ?? "").trim())
                      .filter((cell, index, list) => index < list.length)
                  )
                  .slice(0, 60)
              : []
          }))
          .filter((sheet) => sheet.rows.length)
          .slice(0, 3)
      : [];

    if (!sheets.length) {
      return NextResponse.json({ error: "没有读到可分析的 Excel 内容，请重新选择文件。" }, { status: 400 });
    }

    const rawResult = await callMiniMaxJson<RawExcelImportResult>({
      systemPrompt:
        "你是 OKR Excel 智能导入助手。你要把可能不规范的 Excel 内容整理成 Objective 与 KR 结构。只能根据表格内容做低风险推断，不要编造不存在的信息；拿不准就留空。多个连续 KR 属于同一个 O 时要合并到同一个 objective 下。不要解释，不要 Markdown，回答的第一个字符必须是 { 。",
      maxTokens: 2600,
      userPrompt: [
        "请阅读下面的 Excel 预览内容，并整理成 OKR JSON。",
        "",
        "{",
        '  "summary": "一句中文总结，说明这份 Excel 大概整理出了什么",',
        '  "warnings": ["最多 6 条提醒，比如表头不清晰、权重缺失、部分列无法判断"],',
        '  "objectives": [',
        "    {",
        '      "title": "O 标题",',
        '      "weight": "可写 20% 或 0.2 或留空",',
        '      "owner": "可选",',
        '      "department": "可选",',
        '      "docLink": "可选",',
        '      "krs": [',
        "        {",
        '          "title": "KR 标题",',
        '          "weight": "可写 30% 或 0.3 或留空",',
        '          "type": "承诺型 或 探索型",',
        '          "target2026": "可选",',
        '          "progress": "可选",',
        '          "budgetStr": "可选",',
        '          "metricDefinition": "可选",',
        '          "marchProgressLabel": "默认 3 月进度，没有就留空",',
        '          "completion": 0,',
        '          "dataProvider": "可选",',
        '          "interfacePerson": "可选",',
        '          "alignedDepartments": "可选",',
        '          "alignedOkr": "可选",',
        '          "personnel": [{"name": "姓名", "role": "组长|组员|业务对接|公关组"}]',
        "        }",
        "      ]",
        "    }",
        "  ]",
        "}",
        "",
        "要求：",
        "1. 只输出 JSON，对象外不要有任何文字。",
        "2. 如果表格中同一个 O 在多行重复出现，不要拆成多个 objective。",
        "3. 没把握的字段直接留空，不要硬编预算、负责人、接口人、完成度。",
        "4. 如果出现“负责人/owner/owner部门/责任人”等近义表头，请结合上下文判断。",
        "5. completion 只有表里出现百分比或明确阶段完成度时再给，否则留空。",
        "6. personnel 只有表格里明显出现人名和角色时再给；否则可留空。",
        "",
        `文件名：${fileName || "未命名 Excel"}`,
        "",
        `Excel 预览：${JSON.stringify(sheets)}`
      ].join("\n")
    });

    const result: AiExcelImportResult = sanitizeExcelImportResult(rawResult);

    if (!result.objectives.length) {
      return NextResponse.json({ error: "AI 没有从这份 Excel 里识别出可用的 O / KR 结构。" }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `AI 智能导入失败：${message}` }, { status: 500 });
  }
}
