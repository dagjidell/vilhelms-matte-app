import { useState } from 'react';
import './MultiplicationTeacher.css';
import './DivisionTeacher.css';

const MAX_EXTRA_DECIMALS = 3;
const MAX_DIVIDEND_DIGITS = 10;
const MAX_DIVISOR_DIGITS = 4;

function generateRandomProblem() {
  const divisor = Math.floor(Math.random() * 8) + 2;      // 2-9
  const quotient = Math.floor(Math.random() * 990) + 10;  // 10-999
  return { dividend: String(divisor * quotient), divisor: String(divisor) };
}

function parseDecimal(text) {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d*\.?\d*$/.test(normalized) || !/\d/.test(normalized)) return null;
  const [rawInt, rawDec = ''] = normalized.split('.');
  return {
    intPart: rawInt.replace(/^0+/, '') || '0',
    decPart: rawDec.replace(/0+$/, ''),
  };
}

function formatNumber({ intPart, decPart }) {
  return decPart ? `${intPart},${decPart}` : intPart;
}

// Multiplies by 10^places by moving the decimal comma to the right
function shiftComma({ intPart, decPart }, places) {
  const dec = decPart.padEnd(places, '0');
  return {
    intPart: (intPart + dec.slice(0, places)).replace(/^0+/, '') || '0',
    decPart: dec.slice(places),
  };
}

function solveShortDivision(dividend, divisor) {
  const cols = [];
  for (const d of dividend.intPart) cols.push({ kind: 'digit', digit: Number(d), added: false });
  if (dividend.decPart) {
    cols.push({ kind: 'comma', added: false });
    for (const d of dividend.decPart) cols.push({ kind: 'digit', digit: Number(d), added: false });
  }

  const intLength = dividend.intPart.length;
  let carry = 0;
  let carryFromCol = -1;
  let digitsDone = 0;
  let quotientStarted = false;

  const divideColumn = (col, index) => {
    col.carryIn = carry;
    col.carryFromCol = carryFromCol;
    col.current = carry * 10 + col.digit;
    col.q = Math.floor(col.current / divisor);
    col.remainder = col.current - col.q * divisor;
    // Zeros before the first non-zero integer digit are not written in the answer
    col.leadingZero = !quotientStarted && col.q === 0 && digitsDone < intLength - 1;
    if (!col.leadingZero) quotientStarted = true;
    carry = col.remainder;
    carryFromCol = index;
    digitsDone++;
  };

  cols.forEach((col, i) => {
    if (col.kind === 'digit') divideColumn(col, i);
  });

  let hasComma = dividend.decPart !== '';
  let extra = 0;
  while (carry > 0 && extra < MAX_EXTRA_DECIMALS) {
    if (!hasComma) {
      cols.push({ kind: 'comma', added: true });
      hasComma = true;
    }
    const col = { kind: 'digit', digit: 0, added: true };
    cols.push(col);
    divideColumn(col, cols.length - 1);
    extra++;
  }

  const quotient = cols
    .map((c) => (c.kind === 'comma' ? ',' : c.leadingZero ? '' : c.q))
    .join('');
  return { cols, quotient, finalRemainder: carry };
}

function buildProblem(dividendText, divisorText) {
  const dividend = parseDecimal(dividendText);
  const divisor = parseDecimal(divisorText);
  if (!dividend || !divisor) {
    return { error: 'Skriv två tal, till exempel 846 och 6. Decimaltal skrivs med komma, till exempel 7,5.' };
  }
  if (divisor.intPart === '0' && !divisor.decPart) {
    return { error: 'Man kan inte dela med 0!' };
  }

  const places = divisor.decPart.length;
  const scaledDividend = shiftComma(dividend, places);
  const scaledDivisor = shiftComma(divisor, places);
  if (
    scaledDivisor.intPart.length > MAX_DIVISOR_DIGITS ||
    scaledDividend.intPart.length + scaledDividend.decPart.length > MAX_DIVIDEND_DIGITS
  ) {
    return { error: 'Talen är för stora för att visas. Prova med mindre tal.' };
  }

  const divisorValue = Number(scaledDivisor.intPart);
  return {
    dividend,
    divisor,
    places,
    scaledDividend,
    divisorValue,
    ...solveShortDivision(scaledDividend, divisorValue),
  };
}

function describeDivide(p, i) {
  const col = p.cols[i];
  const d = p.divisorValue;
  const parts = [];

  if (col.carryIn > 0) {
    parts.push(`Minnessiffran ${col.carryIn} och siffran ${col.digit} blir tillsammans ${col.current}.`);
  }

  if (col.leadingZero) {
    parts.push(`${d} går inte i ${col.current}, eftersom ${col.current} är mindre än ${d}. Det blir 0, men en nolla först i svaret behöver vi inte skriva.`);
  } else if (col.q === 0) {
    parts.push(`${d} går 0 gånger i ${col.current}. Skriv 0 i kvoten.`);
  } else {
    parts.push(`${d} går ${col.q} ${col.q === 1 ? 'gång' : 'gånger'} i ${col.current}, eftersom ${col.q} × ${d} = ${col.q * d}. Skriv ${col.q} i kvoten.`);
  }

  if (col.remainder === 0) {
    parts.push(i === p.cols.length - 1 ? 'Det går jämnt ut!' : 'Inget blir kvar.');
  } else {
    const leftover = col.q > 0 ? `${col.current} − ${col.q * d} = ${col.remainder}` : `${col.remainder}`;
    const nextIsOriginal = p.cols.slice(i + 1).some((c) => c.kind === 'digit' && !c.added);
    parts.push(
      nextIsOriginal
        ? `${leftover} blir kvar. Skriv ${col.remainder} som minnessiffra framför nästa siffra.`
        : `${leftover} blir kvar.`
    );
  }

  return parts.join(' ');
}

function describeAddedZero(p, i) {
  const col = p.cols[i];
  const r = col.carryIn;

  if (p.cols[col.carryFromCol].added) {
    return {
      title: 'Lägg till en nolla till',
      description: `Det blev ${r} kvar igen. Lägg till ytterligare en nolla som decimal och skriv ${r} som minnessiffra framför den.`,
    };
  }

  const A = formatNumber(p.scaledDividend);
  const commaAdded = p.cols[i - 1].kind === 'comma' && p.cols[i - 1].added;
  let description = `Det blev ${r} kvar, men täljaren har inga fler siffror. `;
  if (commaAdded && p.places === 0) {
    const intQuotient = p.quotient.split(',')[0];
    description += `Räknar vi bara med heltal blir svaret ${intQuotient} rest ${r}. Men vi kan fortsätta med decimaler! `;
  }
  description += commaAdded
    ? `Eftersom ${A} = ${A},0 kan vi skriva ett kommatecken och en nolla efter täljaren. Sätt också ett kommatecken i kvoten. Skriv ${r} som minnessiffra framför nollan.`
    : `Eftersom ${A} = ${A}0 kan vi lägga till en nolla sist i täljaren. Skriv ${r} som minnessiffra framför nollan.`;

  return { title: 'Fortsätt med decimaler', description };
}

function buildSteps(p) {
  const steps = [];
  const a = formatNumber(p.dividend);
  const b = formatNumber(p.divisor);
  const A = formatNumber(p.scaledDividend);
  const d = p.divisorValue;
  const baseCols = p.cols.filter((c) => !c.added).length;
  const hidden = { shownCols: 0, quotientCols: 0, activeCol: -1 };

  steps.push({ type: 'intro', title: 'Vi ska räkna ut:', description: `${a} ÷ ${b}`, ...hidden });

  if (p.places > 0) {
    steps.push({
      type: 'scale',
      title: 'Gör nämnaren till ett heltal',
      description: `Det är lättare att dela med ett heltal. Multiplicera både täljaren och nämnaren med ${10 ** p.places}, det vill säga flytta kommat ${p.places} steg åt höger i båda talen. Svaret blir detsamma: ${a} ÷ ${b} = ${A} ÷ ${d}`,
      ...hidden,
    });
  }

  steps.push({
    type: 'setup',
    title: 'Ställ upp för kort division',
    description: `Skriv nämnaren ${d} till vänster och täljaren ${A} under strecket. Svaret (kvoten) skriver vi ovanför strecket, en siffra i taget från vänster. Det som blir kvar skriver vi som en liten minnessiffra framför nästa siffra.`,
    shownCols: baseCols,
    quotientCols: 0,
    activeCol: -1,
  });

  p.cols.forEach((col, i) => {
    const shownCols = Math.max(baseCols, i + 1);
    if (col.kind === 'comma') {
      if (!col.added) {
        steps.push({
          type: 'comma',
          title: 'Decimaltecknet',
          description: 'Nu kommer vi till kommat i täljaren. Skriv ett kommatecken i kvoten rakt ovanför.',
          shownCols,
          quotientCols: i + 1,
          activeCol: i,
        });
      }
      return;
    }
    if (col.added) {
      steps.push({ type: 'add-zero', ...describeAddedZero(p, i), shownCols, quotientCols: i, activeCol: i });
    }
    steps.push({
      type: 'divide',
      title: `Hur många gånger går ${d} i ${col.current}?`,
      description: describeDivide(p, i),
      shownCols,
      quotientCols: i + 1,
      activeCol: i,
    });
  });

  const done = { shownCols: p.cols.length, quotientCols: p.cols.length, activeCol: -1 };
  if (p.finalRemainder > 0) {
    steps.push({
      type: 'stop',
      title: 'Det går inte jämnt ut',
      description: `Det blir fortfarande ${p.finalRemainder} kvar. Divisionen går aldrig jämnt ut, så vi stannar här. Svaret blir ungefär ${p.quotient}.`,
      ...done,
    });
  } else {
    steps.push({
      type: 'check',
      title: 'Kontrollera svaret',
      description: `Kontrollera med multiplikation: ${p.quotient} × ${b} = ${a}`,
      ...done,
    });
  }

  steps.push({
    type: 'result',
    title: 'Svar:',
    description: `${a} ÷ ${b} ${p.finalRemainder > 0 ? '≈' : '='} ${p.quotient}`,
    ...done,
  });

  return steps;
}

function ShortDivisionGrid({ problem, step }) {
  const divisorDigits = String(problem.divisorValue).split('');
  const visibleCols = problem.cols.slice(0, step.shownCols);
  const firstCol = divisorDigits.length + 2; // after the divisor digits and the vertical bar
  const isFinal = ['check', 'stop', 'result'].includes(step.type);
  const gridTemplateColumns = [
    ...divisorDigits.map(() => 'var(--sd-cell)'),
    'var(--sd-bar)',
    ...visibleCols.map((c) => (c.kind === 'comma' ? 'var(--sd-comma)' : 'var(--sd-cell)')),
  ].join(' ');

  const isNewComma = (i) =>
    (step.type === 'comma' && i === step.activeCol) ||
    (step.type === 'add-zero' && i === step.activeCol - 1 && problem.cols[i].added);

  return (
    <div className="short-division" style={{ gridTemplateColumns }}>
      {visibleCols.map((col, i) => {
        if (i >= step.quotientCols) return null;
        const style = { gridRow: 1, gridColumn: firstCol + i };
        if (col.kind === 'comma') {
          return (
            <div key={`q${i}`} className={`sd-comma ${isNewComma(i) ? 'active' : ''}`} style={style}>,</div>
          );
        }
        const isActive = step.type === 'divide' && i === step.activeCol;
        if (col.leadingZero && !isActive) return null;
        const classes = ['digit', col.leadingZero ? 'zero' : 'sd-quotient'];
        if (isActive) classes.push('active-digit');
        if (isFinal) classes.push('sd-final');
        return (
          <div key={`q${i}`} className={classes.join(' ')} style={style}>{col.q}</div>
        );
      })}

      <div className="sd-bar-h" style={{ gridRow: 2, gridColumn: `${firstCol - 1} / -1` }} />
      <div className="sd-bar-v" style={{ gridRow: '2 / 4', gridColumn: firstCol - 1 }} />

      {divisorDigits.map((digit, i) => (
        <div key={`d${i}`} className="digit sd-divisor" style={{ gridRow: 3, gridColumn: i + 1 }}>{digit}</div>
      ))}

      {visibleCols.map((col, i) => {
        const style = { gridRow: 3, gridColumn: firstCol + i };
        if (col.kind === 'comma') {
          return (
            <div
              key={`n${i}`}
              className={`sd-comma ${col.added ? 'sd-comma-added' : ''} ${isNewComma(i) ? 'active' : ''}`}
              style={style}
            >,</div>
          );
        }
        const showCarry = col.carryIn > 0 && col.carryFromCol < step.quotientCols;
        const isNewCarry = showCarry && (
          (step.type === 'divide' && col.carryFromCol === step.activeCol) ||
          (step.type === 'add-zero' && i === step.activeCol)
        );
        const classes = ['digit', 'sd-cell', col.added ? 'sd-added' : 'sd-dividend'];
        if (i === step.activeCol) classes.push('active-digit');
        return (
          <div key={`n${i}`} className={classes.join(' ')} style={style}>
            {showCarry && <span className={`sd-carry ${isNewCarry ? 'new' : ''}`}>{col.carryIn}</span>}
            {col.digit}
          </div>
        );
      })}
    </div>
  );
}

export default function DivisionTeacher() {
  const [initial] = useState(generateRandomProblem);
  const [dividendInput, setDividendInput] = useState(initial.dividend);
  const [divisorInput, setDivisorInput] = useState(initial.divisor);
  const [currentStep, setCurrentStep] = useState(0);

  const problem = buildProblem(dividendInput, divisorInput);
  const steps = problem.error ? [] : buildSteps(problem);
  const step = steps[currentStep];

  return (
    <div className="division-teacher">
      <header>
        <h1>Division steg för steg</h1>
        <p>Kort division</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="dividend">Täljare:</label>
          <input
            id="dividend"
            type="text"
            inputMode="decimal"
            value={dividendInput}
            onChange={(e) => {
              setDividendInput(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="846"
          />
        </div>
        <div className="multiply-symbol">÷</div>
        <div className="input-group">
          <label htmlFor="divisor">Nämnare:</label>
          <input
            id="divisor"
            type="text"
            inputMode="decimal"
            value={divisorInput}
            onChange={(e) => {
              setDivisorInput(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="6"
          />
        </div>
      </div>

      {problem.error ? (
        <div className="step-info">
          <h2>Hoppsan!</h2>
          <p>{problem.error}</p>
        </div>
      ) : (
        <>
          <div className="step-info">
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </div>

          <div className="visualization">
            {step.shownCols > 0 && <ShortDivisionGrid problem={problem} step={step} />}
          </div>

          <div className="controls">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="btn btn-prev"
            >
              ← Föregående
            </button>
            <button onClick={() => setCurrentStep(0)} className="btn btn-reset">
              ↺ Börja om
            </button>
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
              className="btn btn-next"
            >
              Nästa →
            </button>
          </div>

          <div className="progress">
            Steg {currentStep + 1} av {steps.length}
          </div>
        </>
      )}
    </div>
  );
}
