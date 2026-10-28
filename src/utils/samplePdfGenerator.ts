import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SamplePaperInfo {
  title: string;
  paperCode?: string;
  course?: string;
  subject?: string;
  academicYear?: string;
  semester?: string;
  examination?: string;
}

/**
 * Generates an authentic, high-quality sample Question Paper PDF as a Base64 Data URL.
 * Uses pdf-lib to build a multi-section PDF document matching Sambalpur University CBCS format.
 */
export async function generateSampleQuestionPaperPdfDataUrl(info: SamplePaperInfo): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size (595.28 x 841.89 pt)
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const darkNavy = rgb(0.047, 0.137, 0.251); // #0c2340
    const goldAmber = rgb(0.85, 0.55, 0.05);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.93, 0.95, 0.97);

    // 1. Outer Header Box
    page.drawRectangle({
      x: 35,
      y: height - 110,
      width: width - 70,
      height: 75,
      color: lightGray,
      borderColor: darkNavy,
      borderWidth: 1.5,
    });

    // College Name Header
    const univText = 'PANCHAYAT COLLEGE, BARAGADA';
    const univWidth = fontBold.widthOfTextAtSize(univText, 15);
    page.drawText(univText, {
      x: (width - univWidth) / 2,
      y: height - 55,
      size: 15,
      font: fontBold,
      color: darkNavy,
    });

    const deptText = 'DEPARTMENT OF MATHEMATICS • SAMBALPUR UNIVERSITY';
    const deptWidth = fontBold.widthOfTextAtSize(deptText, 10);
    page.drawText(deptText, {
      x: (width - deptWidth) / 2,
      y: height - 72,
      size: 10,
      font: fontBold,
      color: goldAmber,
    });

    const examTitle = info.examination || 'Semester End Examination (CBCS)';
    const examYear = info.academicYear ? `Session ${info.academicYear}` : 'Academic Session 2025–26';
    const examSub = `${examTitle} • ${examYear}`;
    const examWidth = fontRegular.widthOfTextAtSize(examSub, 9);
    page.drawText(examSub, {
      x: (width - examWidth) / 2,
      y: height - 90,
      size: 9,
      font: fontRegular,
      color: darkGray,
    });

    // 2. Paper Metadata Strip
    let currentY = height - 125;
    page.drawLine({
      start: { x: 35, y: currentY },
      end: { x: width - 35, y: currentY },
      thickness: 1,
      color: darkNavy,
    });

    currentY -= 18;
    const courseText = `COURSE: ${info.course || 'UG (B.Sc. Hons)'} • ${info.semester || 'Semester I'}`;
    page.drawText(courseText, {
      x: 40,
      y: currentY,
      size: 10,
      font: fontBold,
      color: darkNavy,
    });

    const codeText = `PAPER CODE: ${info.paperCode || 'MATH-CC-101'}`;
    const codeWidth = fontBold.widthOfTextAtSize(codeText, 10);
    page.drawText(codeText, {
      x: width - 40 - codeWidth,
      y: currentY,
      size: 10,
      font: fontBold,
      color: darkNavy,
    });

    currentY -= 18;
    const paperNameText = `SUBJECT: ${info.title || 'Core Course 1: Calculus and Geometry'}`;
    page.drawText(paperNameText, {
      x: 40,
      y: currentY,
      size: 10.5,
      font: fontBold,
      color: darkNavy,
    });

    currentY -= 16;
    const infoLine = 'Time: 3 Hours                                                     Full Marks: 80';
    page.drawText(infoLine, {
      x: 40,
      y: currentY,
      size: 9,
      font: fontOblique,
      color: darkGray,
    });

    currentY -= 10;
    page.drawLine({
      start: { x: 35, y: currentY },
      end: { x: width - 35, y: currentY },
      thickness: 1,
      color: darkNavy,
    });

    // 3. Instructions Box
    currentY -= 22;
    page.drawText('INSTRUCTIONS TO CANDIDATES:', {
      x: 40,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkNavy,
    });
    currentY -= 14;
    page.drawText('1. Figures in the right-hand margin indicate full marks for the questions.', {
      x: 50,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkGray,
    });
    currentY -= 13;
    page.drawText('2. Candidates are required to give their answers in their own words as far as practicable.', {
      x: 50,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkGray,
    });
    currentY -= 13;
    page.drawText('3. Answer all questions from Group-A, four from Group-B, and two from Group-C.', {
      x: 50,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkGray,
    });

    // 4. GROUP A
    currentY -= 25;
    page.drawRectangle({
      x: 35,
      y: currentY - 4,
      width: width - 70,
      height: 16,
      color: lightGray,
    });
    page.drawText('GROUP – A (Compulsory Short Answer Questions - 2 x 10 = 20 Marks)', {
      x: 42,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkNavy,
    });

    const groupAQuestions = [
      '1. (a) Define supremum and infimum of a subset of R with a suitable non-empty bounded example.',
      '   (b) State the Archimedean property of real numbers and discuss its immediate corollary.',
      '   (c) Test the convergence of the series sum 1 / (n^2 + 3n + 1) using comparison test.',
      '   (d) Find the n-th derivative of y = e^(2x) * cos(3x + 1) using Leibniz theorem.',
      '   (e) Evaluate limit as x -> 0 of (tan x - x) / x^3 using L\'Hopital\'s rule.',
      '   (f) State Rolle\'s theorem and verify it for f(x) = x(x - 2)^2 on the interval [0, 2].',
      '   (g) Define homogeneous function and state Euler\'s theorem for functions of two variables.',
      '   (h) Find the asymptotes parallel to co-ordinate axes for the curve x^2 y^2 - x^2 y = 0.',
      '   (i) Evaluate the line integral integral_C (x dx + y dy) along the unit circle x^2 + y^2 = 1.',
      '   (j) Define exact differential equation and write the necessary condition for exactness.',
    ];

    currentY -= 18;
    for (const q of groupAQuestions) {
      page.drawText(q, {
        x: 42,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: darkGray,
      });
      currentY -= 13;
    }

    // 5. GROUP B
    currentY -= 12;
    page.drawRectangle({
      x: 35,
      y: currentY - 4,
      width: width - 70,
      height: 16,
      color: lightGray,
    });
    page.drawText('GROUP – B (Short Answer Type - Answer any 4 questions - 6 x 4 = 24 Marks)', {
      x: 42,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkNavy,
    });

    const groupBQuestions = [
      '2. Show that every convergent sequence of real numbers is bounded. Is the converse true? Justify.',
      '3. If u = tan^-1((x^3 + y^3) / (x - y)), prove that x du/dx + y du/dy = sin(2u).',
      '4. Find the radius of curvature at any point (r, theta) for the cardioid r = a(1 + cos theta).',
      '5. Solve the second-order linear differential equation: (D^2 + 4D + 5)y = e^(-2x) * sin x.',
      '6. Test the absolute and conditional convergence of the alternating series sum (-1)^(n+1) / n^(1/2).',
    ];

    currentY -= 18;
    for (const q of groupBQuestions) {
      page.drawText(q, {
        x: 42,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: darkGray,
      });
      currentY -= 13;
    }

    // 6. GROUP C
    currentY -= 12;
    page.drawRectangle({
      x: 35,
      y: currentY - 4,
      width: width - 70,
      height: 16,
      color: lightGray,
    });
    page.drawText('GROUP – C (Long Answer Type - Answer any 2 questions - 18 x 2 = 36 Marks)', {
      x: 42,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkNavy,
    });

    const groupCQuestions = [
      '7. State and prove Taylor\'s theorem with Lagrange\'s form of remainder. Expand f(x) = log(1+x).',
      '8. (a) Solve by method of variation of parameters: d^2y/dx^2 + y = sec x.',
      '   (b) Trace the curve y^2 (a - x) = x^3 and calculate the total area enclosed by its loop.',
      '9. State and prove Cauchy\'s Root Test for positive term series. Test convergence of sum (1 + 1/n)^(-n^2).',
    ];

    currentY -= 18;
    for (const q of groupCQuestions) {
      page.drawText(q, {
        x: 42,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: darkGray,
      });
      currentY -= 13;
    }

    // 7. Footer Strip
    page.drawLine({
      start: { x: 35, y: 40 },
      end: { x: width - 35, y: 40 },
      thickness: 1,
      color: darkNavy,
    });

    const footerText = 'PANCHAYAT COLLEGE, BARAGADA • DEPARTMENT OF MATHEMATICS • ACADEMIC DIGITAL REPOSITORY';
    const footerWidth = fontRegular.widthOfTextAtSize(footerText, 7.5);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 28,
      size: 7.5,
      font: fontRegular,
      color: darkNavy,
    });

    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });
    return pdfBase64;
  } catch (err) {
    console.error('Error generating sample question paper PDF:', err);
    // Minimal fallback PDF data URL
    return 'data:application/pdf;base64,JVBERi0xLjQKJS...';
  }
}
