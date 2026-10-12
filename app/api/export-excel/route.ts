
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Risk = {
  id: string;
  tehlike: string;
  gerekce: string;
  onlem: string;
  olasilik: number;
  siddet: number;
  skor: number;
  seviye: string;
  onay: "onaylandi" | "duzenlendi";
};

type Profile = "isg" | "ev" | "okul";

const C = {
  dark: "FF0B0C10",
  purple: "FF392452",
  amethyst: "FF9966CC",
  pale: "FFF3EDF9",
  white: "FFFFFFFF",
  text: "FF24202B",
  muted: "FF746D7E",
  border: "FFDDD5E5",
  green: "FF3FB27F",
  greenBg: "FFE2F4EB",
  yellow: "FFE0A73A",
  yellowBg: "FFFFF1D4",
  red: "FFF0676B",
  redBg: "FFFCE5E6",
  light: "FFF8F6FA",
};

const profileNames: Record<Profile, string> = {
  isg: "İŞ YERİ",
  ev: "EV",
  okul: "OKUL",
};

function safeCell(value: string): string {
  return /^\s*[=+@-]/.test(value) ? "'" + value : value;
}

function isRisk(value: unknown): value is Risk {
  if (!value || typeof value !== "object") return false;

  const r = value as Record<string, unknown>;

  const validStrings = [
    "id",
    "tehlike",
    "gerekce",
    "onlem",
    "seviye",
  ].every(
    (key) =>
      typeof r[key] === "string" &&
      (r[key] as string).length <= 2000
  );

  const validNumbers = [
    "olasilik",
    "siddet",
    "skor",
  ].every(
    (key) =>
      typeof r[key] === "number" &&
      Number.isFinite(r[key])
  );

  return (
    validStrings &&
    validNumbers &&
    (r.onay === "onaylandi" || r.onay === "duzenlendi")
  );
}

function fill(color: string): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color },
  };
}

function setTitle(
  sheet: ExcelJS.Worksheet,
  range: string,
  text: string,
  size = 18
) {
  sheet.mergeCells(range);

  const cell = sheet.getCell(range.split(":")[0]);

  cell.value = text;
  cell.fill = fill(C.purple);
  cell.font = {
    name: "Aptos Display",
    size,
    bold: true,
    color: { argb: C.white },
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 0,
    shrinkToFit: true,
  };
}

function setSection(
  sheet: ExcelJS.Worksheet,
  range: string,
  text: string
) {
  sheet.mergeCells(range);

  const cell = sheet.getCell(range.split(":")[0]);

  cell.value = text;
  cell.fill = fill(C.purple);
  cell.font = {
    name: "Aptos",
    size: 11,
    bold: true,
    color: { argb: C.white },
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 0,
  };
}

function riskStyle(score: number) {
  if (score >= 20) {
    return { bg: C.redBg, color: "FFAD2536" };
  }

  if (score >= 15) {
    return { bg: "FFFFE7DD", color: "FFB84D24" };
  }

  if (score >= 8) {
    return { bg: C.yellowBg, color: "FF9B680C" };
  }

  if (score >= 2) {
    return { bg: C.greenBg, color: "FF18784B" };
  }

  return { bg: "FFEAF5EF", color: "FF18784B" };
}

function formatSheet(sheet: ExcelJS.Worksheet) {
  sheet.properties.defaultRowHeight = 22;

  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };

  sheet.headerFooter.oddFooter =
    "&LSkyEngineX / Sarsıntı&CSayfa &P / &N&Rİç Mekân Risk Raporu";
}

function createSummary(
  workbook: ExcelJS.Workbook,
  risks: Risk[],
  profile: string,
  demo: boolean,
  date: string
) {
  const sheet = workbook.addWorksheet("Rapor Özeti", {
    views: [{ showGridLines: false }],
  });

  sheet.columns = Array.from({ length: 8 }, () => ({
    width: 19,
  }));

  formatSheet(sheet);

  sheet.getRow(1).height = 14;
  sheet.getRow(2).height = 48;
  sheet.getRow(3).height = 31;

  setTitle(
    sheet,
    "A2:H2",
    "SKYENGINEX  /  SARSINTI",
    22
  );

  sheet.mergeCells("A3:H3");

  const subtitle = sheet.getCell("A3");

  subtitle.value =
    "MEKÂNSAL RİSK DEĞERLENDİRME RAPORU";
  subtitle.font = {
    bold: true,
    size: 13,
    color: { argb: C.amethyst },
  };
  subtitle.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 0,
  };

  sheet.getRow(5).height = 32;
  setSection(sheet, "A5:H5", "01 / RAPOR BİLGİLERİ");

  const info = [
    ["ANALİZ PROFİLİ", profile],
    ["RAPOR TARİHİ", date],
    ["RAPOR TÜRÜ", demo ? "DEMO / TEMSİLİ" : "API ANALİZİ"],
  ];

  info.forEach(([label, value], index) => {
    const row = 6 + index;

    sheet.getRow(row).height = 30;
    sheet.mergeCells(`A${row}:C${row}`);
    sheet.mergeCells(`D${row}:H${row}`);

    const labelCell = sheet.getCell(`A${row}`);
    const valueCell = sheet.getCell(`D${row}`);

    labelCell.value = label;
    labelCell.font = {
      bold: true,
      size: 11,
      color: { argb: C.muted },
    };

    valueCell.value = value;
    valueCell.font = {
      bold: true,
      size: 12,
      color: { argb: C.text },
    };

    labelCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 0,
    };
    valueCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      indent: 0,
    };

    const background =
      index % 2 === 0 ? C.light : C.white;

    labelCell.fill = fill(background);
    valueCell.fill = fill(background);
  });

  sheet.getRow(10).height = 32;
  setSection(sheet, "A10:H10", "02 / RİSK ÖZETİ");

  const critical = risks.filter(
    (r) => r.skor >= 15
  ).length;

  const medium = risks.filter(
    (r) => r.skor >= 8 && r.skor < 15
  ).length;

  const low = risks.filter(
    (r) => r.skor < 8
  ).length;

  const metrics = [
    {
      range: "A12:B12",
      valueRange: "A13:B15",
      label: "ONAYLI RİSK",
      value: risks.length,
      color: C.amethyst,
    },
    {
      range: "C12:D12",
      valueRange: "C13:D15",
      label: "YÜKSEK / KRİTİK",
      value: critical,
      color: C.red,
    },
    {
      range: "E12:F12",
      valueRange: "E13:F15",
      label: "ORTA RİSK",
      value: medium,
      color: C.yellow,
    },
    {
      range: "G12:H12",
      valueRange: "G13:H15",
      label: "DÜŞÜK RİSK",
      value: low,
      color: C.green,
    },
  ];

  for (const metric of metrics) {
    sheet.mergeCells(metric.range);
    sheet.mergeCells(metric.valueRange);

    const label = sheet.getCell(
      metric.range.split(":")[0]
    );

    const value = sheet.getCell(
      metric.valueRange.split(":")[0]
    );

    label.value = metric.label;
    label.fill = fill(C.purple);
    label.font = {
      size: 10,
      bold: true,
      color: { argb: C.white },
    };
    label.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    value.value = metric.value;
    value.fill = fill(C.light);
    value.font = {
      size: 32,
      bold: true,
      color: { argb: metric.color },
    };
    value.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }

  sheet.getRow(12).height = 30;
  sheet.getRow(13).height = 26;
  sheet.getRow(14).height = 26;
  sheet.getRow(15).height = 26;

  sheet.getRow(17).height = 32;
  setSection(
    sheet,
    "A17:H17",
    "03 / DEĞERLENDİRME NOTU"
  );

  sheet.mergeCells("A18:H20");

  const note = sheet.getCell("A18");

  note.value = demo
    ? "DEMO / TEMSİLİ VERİ\nBu rapordaki riskler yüklenen fotoğraftan hesaplanmamıştır. Gösterim amacıyla hazırlanmış örnek risk kayıtlarıdır."
    : "Bu rapor, analiz sisteminin ürettiği ve kullanıcı tarafından onaylanan veya düzenlenen risk kayıtlarını içerir. Uzman değerlendirmesinin yerine geçmez.";

  note.fill = fill(demo ? C.yellowBg : C.pale);
  note.font = {
    size: 12,
    color: { argb: C.text },
    bold: demo,
  };
  note.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
    indent: 0,
  };

  sheet.getRow(18).height = 30;
  sheet.getRow(19).height = 30;
  sheet.getRow(20).height = 30;

  sheet.getRow(22).height = 32;
  setSection(
    sheet,
    "A22:H22",
    "04 / RAPOR KAPSAMI"
  );

  sheet.mergeCells("A23:H25");

  const scope = sheet.getCell("A23");

  scope.value =
    "Bu çalışma mekân içindeki eşya, mobilya ve yerleşim kaynaklı riskleri değerlendirir. Binanın taşıyıcı sistemini, yapısal hasarını veya depreme dayanıklılığını ölçmez. Risk skorları olasılık × şiddet yöntemiyle ifade edilir.";

  scope.font = {
    size: 12,
    color: { argb: C.text },
  };
  scope.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
    indent: 0,
  };

  sheet.getRow(23).height = 30;
  sheet.getRow(24).height = 30;
  sheet.getRow(25).height = 30;

  sheet.getRow(27).height = 27;
  sheet.mergeCells("A27:H27");

  const footer = sheet.getCell("A27");

  footer.value =
    "SKYENGINEX  •  BUILD. REFINE. MOVE FORWARD.";
  footer.font = {
    bold: true,
    size: 10,
    color: { argb: C.amethyst },
  };
  footer.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  sheet.pageSetup.printArea = "A1:H27";
}

function createRiskRegister(
  workbook: ExcelJS.Workbook,
  risks: Risk[],
  profile: string,
  demo: boolean,
  date: string
) {
  const sheet = workbook.addWorksheet(
    "Risk Değerlendirmesi",
    {
      views: [
        {
          state: "frozen",
          ySplit: 6,
          showGridLines: false,
        },
      ],
    }
  );

  sheet.columns = [
    { key: "id", width: 14 },
    { key: "tehlike", width: 35 },
    { key: "gerekce", width: 49 },
    { key: "onlem", width: 53 },
    { key: "olasilik", width: 16 },
    { key: "siddet", width: 16 },
    { key: "skor", width: 16 },
    { key: "seviye", width: 25 },
    { key: "onay", width: 22 },
  ];

  formatSheet(sheet);

  sheet.getRow(1).height = 46;

  setTitle(
    sheet,
    "A1:I1",
    "SKYENGINEX / SARSINTI  —  RİSK KAYITLARI",
    17
  );

  sheet.mergeCells("A2:I2");
  sheet.getRow(2).height = 30;

  const subtitle = sheet.getCell("A2");

  subtitle.value =
    `PROFİL: ${profile}     •     TARİH: ${date}     •     ONAYLI KAYIT: ${risks.length}`;

  subtitle.font = {
    bold: true,
    color: { argb: C.purple },
    size: 12,
  };
  subtitle.alignment = {
    horizontal: "left",
    vertical: "middle",
    indent: 0,
  };

  sheet.mergeCells("A3:I3");
  sheet.getRow(3).height = 36;

  const notice = sheet.getCell("A3");

  notice.value = demo
    ? "DEMO / TEMSİLİ VERİ — Bu bulgular yüklenen fotoğraftan hesaplanmamıştır."
    : "Bilgilendirme: Bu rapor uzman değerlendirmesinin yerine geçmez.";

  notice.fill = fill(demo ? C.yellowBg : C.pale);
  notice.font = {
    bold: true,
    size: 11,
    color: {
      argb: demo ? "FF94620C" : C.purple,
    },
  };
  notice.alignment = {
    horizontal: "left",
    vertical: "middle",
    indent: 0,
  };

  sheet.getRow(5).height = 30;
  setSection(
    sheet,
    "A5:I5",
    "ONAYLANAN / DÜZENLENEN RİSKLER"
  );

  const headers = [
    "RİSK ID",
    "TEHLİKE",
    "GEREKÇE",
    "ÖNERİLEN ÖNLEM",
    "OLASILIK",
    "ŞİDDET",
    "RİSK SKORU",
    "RİSK SEVİYESİ",
    "KONTROL DURUMU",
  ];

  const headerRow = sheet.getRow(6);
  headerRow.values = headers;
  headerRow.height = 40;

  headerRow.eachCell((cell) => {
    cell.fill = fill(C.purple);
    cell.font = {
      bold: true,
      size: 10,
      color: { argb: C.white },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      right: {
        style: "thin",
        color: { argb: "FF604779" },
      },
    };
  });

  risks.forEach((risk, index) => {
    const row = sheet.addRow({
      id: safeCell(risk.id),
      tehlike: safeCell(risk.tehlike),
      gerekce: safeCell(risk.gerekce),
      onlem: safeCell(risk.onlem),
      olasilik: risk.olasilik,
      siddet: risk.siddet,
      skor: risk.skor,
      seviye: safeCell(risk.seviye),
      onay:
        risk.onay === "duzenlendi"
          ? "DÜZENLENDİ"
          : "ONAYLANDI",
    });

    row.height = 76;

    const background =
      index % 2 === 0 ? C.white : C.light;

    row.eachCell(
      { includeEmpty: true },
      (cell) => {
        cell.fill = fill(background);
        cell.font = {
          name: "Aptos",
          size: 11,
          color: { argb: C.text },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
          indent: 0,
        };
        cell.border = {
          bottom: {
            style: "thin",
            color: { argb: C.border },
          },
        };
      }
    );

    const style = riskStyle(risk.skor);

    for (const col of [7, 8]) {
      const cell = row.getCell(col);

      cell.fill = fill(style.bg);
      cell.font = {
        bold: true,
        size: 11,
        color: { argb: style.color },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    }

    const status = row.getCell(9);

    status.fill = fill(C.greenBg);
    status.font = {
      bold: true,
      color: { argb: "FF18784B" },
    };
    status.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    for (const col of [5, 6]) {
      row.getCell(col).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    row.getCell(2).font = {
      bold: true,
      size: 11,
      color: { argb: C.text },
    };
  });

  sheet.autoFilter = {
    from: "A6",
    to: `I${6 + risks.length}`,
  };

  sheet.pageSetup.printTitlesRow = "1:6";
  sheet.pageSetup.printArea =
    `A1:I${6 + risks.length}`;
}

function createRiskMatrix(
  workbook: ExcelJS.Workbook
) {
  const sheet = workbook.addWorksheet(
    "5x5 Risk Matrisi",
    {
      views: [{ showGridLines: false }],
    }
  );

  sheet.columns = [
    { width: 23 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 24 },
  ];

  formatSheet(sheet);

  sheet.getRow(1).height = 44;

  setTitle(
    sheet,
    "A1:G1",
    "5 × 5  RİSK MATRİSİ",
    19
  );

  sheet.mergeCells("A2:G2");
  sheet.getRow(2).height = 32;

  const subtitle = sheet.getCell("A2");

  subtitle.value =
    "RİSK SKORU = OLASILIK × ŞİDDET";
  subtitle.font = {
    bold: true,
    color: { argb: C.amethyst },
    size: 12,
  };
  subtitle.alignment = {
    horizontal: "left",
    vertical: "middle",
    indent: 0,
  };

  sheet.getRow(4).height = 30;

  setSection(
    sheet,
    "A4:G4",
    "OLASILIK / ŞİDDET MATRİSİ"
  );

  const header = sheet.getRow(6);

  header.values = [
    "OLASILIK ↓ / ŞİDDET →",
    "1",
    "2",
    "3",
    "4",
    "5",
  ];

  header.height = 40;

  for (let col = 1; col <= 6; col++) {
    const cell = header.getCell(col);

    cell.fill = fill(C.purple);
    cell.font = {
      bold: true,
      color: { argb: C.white },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  for (
    let probability = 5;
    probability >= 1;
    probability--
  ) {
    const rowNumber = 12 - probability;
    const row = sheet.getRow(rowNumber);

    row.height = 57;

    const label = row.getCell(1);

    label.value =
      `OLASILIK ${probability}`;
    label.fill = fill(C.purple);
    label.font = {
      bold: true,
      color: { argb: C.white },
    };
    label.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    for (
      let severity = 1;
      severity <= 5;
      severity++
    ) {
      const score = probability * severity;
      const style = riskStyle(score);

      const cell = row.getCell(
        severity + 1
      );

      cell.value = score;
      cell.fill = fill(style.bg);
      cell.font = {
        bold: true,
        size: 18,
        color: { argb: style.color },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.border = {
        top: {
          style: "thin",
          color: { argb: C.white },
        },
        bottom: {
          style: "thin",
          color: { argb: C.white },
        },
        left: {
          style: "thin",
          color: { argb: C.white },
        },
        right: {
          style: "thin",
          color: { argb: C.white },
        },
      };
    }
  }

  sheet.getRow(13).height = 30;

  setSection(
    sheet,
    "A13:G13",
    "RİSK SEVİYESİ AÇIKLAMALARI"
  );

  const levels = [
    ["1", "ÖNEMSİZ", "En düşük risk düzeyi"],
    ["2–6", "DÜŞÜK", "İzleme ve basit önlemler"],
    ["8–12", "ORTA", "Planlı iyileştirme"],
    ["15–16", "YÜKSEK", "Öncelikli müdahale"],
    ["20–25", "TOLERE EDİLEMEZ", "Acil risk azaltma"],
  ];

  levels.forEach(
    ([range, label, description], index) => {
      const rowNumber = 14 + index;

      sheet.getRow(rowNumber).height = 32;

      sheet.getCell(
        `A${rowNumber}`
      ).value = range;

      sheet.mergeCells(
        `B${rowNumber}:C${rowNumber}`
      );

      sheet.getCell(
        `B${rowNumber}`
      ).value = label;

      sheet.mergeCells(
        `D${rowNumber}:G${rowNumber}`
      );

      sheet.getCell(
        `D${rowNumber}`
      ).value = description;

      const representative =
        [1, 4, 10, 16, 20][index];

      const style = riskStyle(
        representative
      );

      for (const address of [
        `A${rowNumber}`,
        `B${rowNumber}`,
      ]) {
        const cell =
          sheet.getCell(address);

        cell.fill = fill(style.bg);
        cell.font = {
          bold: true,
          color: { argb: style.color },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }

      const descriptionCell =
        sheet.getCell(
          `D${rowNumber}`
        );

      descriptionCell.font = {
        color: { argb: C.text },
      };
      descriptionCell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 0,
      };
    }
  );

  sheet.mergeCells("A20:G22");

  const note = sheet.getCell("A20");

  note.value =
    "ÖNEMLİ: Bu matris iç mekân eşya ve yerleşim riskleri için kullanılır. Binanın yapısal deprem dayanımını veya hasar güvenliğini değerlendirmez.";

  note.fill = fill(C.yellowBg);
  note.font = {
    bold: true,
    size: 11,
    color: { argb: "FF94620C" },
  };
  note.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
    indent: 0,
  };

  sheet.getRow(20).height = 28;
  sheet.getRow(21).height = 28;
  sheet.getRow(22).height = 28;

  sheet.pageSetup.printArea = "A1:G22";
}

export async function POST(
  request: Request
) {
  try {
    const body: unknown =
      await request.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return new NextResponse(
        "Geçersiz rapor isteği.",
        { status: 400 }
      );
    }

    const input = body as Record<
      string,
      unknown
    >;

    if (
      !Array.isArray(input.risks) ||
      input.risks.length < 1 ||
      input.risks.length > 200 ||
      !input.risks.every(isRisk)
    ) {
      return new NextResponse(
        "Rapor için 1–200 geçerli onaylı risk gereklidir.",
        { status: 400 }
      );
    }

    if (
      input.profile !== "isg" &&
      input.profile !== "ev" &&
      input.profile !== "okul"
    ) {
      return new NextResponse(
        "Geçersiz analiz profili.",
        { status: 400 }
      );
    }

    if (
      typeof input.demo !== "boolean"
    ) {
      return new NextResponse(
        "Geçersiz demo bilgisi.",
        { status: 400 }
      );
    }

    const risks =
      input.risks as Risk[];

    const profile =
      profileNames[input.profile];

    const demo = input.demo;

    const date =
      new Date().toLocaleDateString(
        "tr-TR",
        {
          timeZone: "Europe/Istanbul",
        }
      );

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "SkyEngineX Sarsıntı";

    workbook.created = new Date();
    workbook.modified = new Date();

    workbook.subject =
      "İç Mekân Risk Değerlendirme Raporu";

    workbook.title =
      "SkyEngineX / Sarsıntı";

    createSummary(
      workbook,
      risks,
      profile,
      demo,
      date
    );

    createRiskRegister(
      workbook,
      risks,
      profile,
      demo,
      date
    );

    createRiskMatrix(workbook);

    const buffer =
      await workbook.xlsx.writeBuffer();

    const bytes =
      new Uint8Array(
        buffer.byteLength
      );

    bytes.set(
      new Uint8Array(
        buffer as ArrayBuffer
      )
    );

    return new Response(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="SkyEngineX_Risk_Raporu.xlsx"',
        "Cache-Control":
          "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Excel export failed:",
      error
    );

    return new NextResponse(
      "Excel raporu oluşturulamadı.",
      { status: 500 }
    );
  }
}
