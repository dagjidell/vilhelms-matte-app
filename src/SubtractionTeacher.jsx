import { useState } from 'react';
import './TeacherCommon.css';
import './SubtractionTeacher.css';

const MAX_DIGITS = 7;
const PLACE = ['ental', 'tiotal', 'hundratal', 'tusental', 'tiotusental', 'hundratusental', 'miljontal'];
const definite = (i) => `${PLACE[i]}en`;

function generateRandomProblem() {
  const top = Math.floor(Math.random() * 9900) + 100;     // 100-9999
  const bottom = Math.floor(Math.random() * (top - 10)) + 10; // 10 to top-1
  return { top: String(top), bottom: String(bottom) };
}

function buildProblem(topText, bottomText) {
  const topStr = topText.trim();
  const bottomStr = bottomText.trim();
  if (!/^\d+$/.test(topStr) || !/^\d+$/.test(bottomStr)) {
    return { error: 'Skriv två heltal, till exempel 512 och 39.' };
  }
  const top = Number(topStr);
  const bottom = Number(bottomStr);
  if (String(top).length > MAX_DIGITS) {
    return { error: `Talen är för stora för att visas. Använd högst ${MAX_DIGITS} siffror.` };
  }
  if (bottom > top) {
    return { error: 'Det andra talet är större än det första. Då blir svaret negativt, och det räknar vi inte med uppställning. Byt plats på talen!' };
  }
  return { top, bottom };
}

function buildSteps(top, bottom) {
  const topDigits = String(top).split('').reverse().map(Number);
  const bottomDigits = String(bottom).split('').reverse().map(Number);
  const n = topDigits.length;
  const answer = top - bottom;
  const answerLength = String(answer).length;

  const cols = topDigits.map((digit, i) => ({
    digit,
    bottom: i < bottomDigits.length ? bottomDigits[i] : null,
    value: digit,
    digitCrossed: false,
    marks: [],
  }));
  const result = Array(n).fill(null);
  const steps = [];

  const push = (step) =>
    steps.push({
      active: -1,
      show: true,
      ...step,
      cols: cols.map((c) => ({ ...c, marks: c.marks.map((m) => ({ ...m })) })),
      result: [...result],
    });

  // Lending: cross out what is written and write the new, smaller value above
  const lend = (k) => {
    const col = cols[k];
    col.digitCrossed = true;
    col.marks.forEach((m) => { m.crossed = true; });
    col.value -= 1;
    col.marks.push({ text: String(col.value), crossed: false, stepId: steps.length });
  };

  // Receiving: write a small 10 above the column
  const receive = (k) => {
    cols[k].value += 10;
    cols[k].marks.push({ text: '10', crossed: false, stepId: steps.length });
  };

  push({
    type: 'intro',
    title: 'Vi ska räkna ut:',
    description: `${top} − ${bottom}`,
    show: false,
  });

  push({
    type: 'setup',
    title: 'Ställ upp talen',
    description: 'Skriv det första talet överst och det andra under, så att ental hamnar under ental, tiotal under tiotal och så vidare. Vi börjar räkna från höger, med entalen.',
  });

  cols.forEach((col, i) => {
    const b = col.bottom ?? 0;

    if (col.value < b) {
      const before = col.value;
      let j = i + 1;
      while (cols[j].value === 0) j++;

      if (j === i + 1) {
        const old = cols[j].value;
        lend(j);
        receive(i);
        push({
          type: 'exchange',
          title: `Växla 1 ${PLACE[j]} till 10 ${PLACE[i]}`,
          description: `Vi kan inte ta bort ${b} från ${before}, eftersom ${before} är mindre än ${b}. Därför växlar vi 1 ${PLACE[j]} till 10 ${PLACE[i]}. Stryk ${old}:an och skriv ${cols[j].value} ovanför. Skriv 10 ovanför ${definite(i)}. Nu har vi 10 + ${before} = ${col.value} ${PLACE[i]}.`,
          active: i,
        });
      } else {
        const zeros = [];
        for (let k = i + 1; k < j; k++) zeros.push(`0 ${PLACE[k]}`);
        push({
          type: 'need-exchange',
          title: `Vi behöver växla`,
          description: `Vi kan inte ta bort ${b} från ${before}, eftersom ${before} är mindre än ${b}. Men det finns ${zeros.join(' och ')}, så där finns inget att växla. Vi får gå vidare till ${definite(j)} och växla därifrån.`,
          active: i,
        });

        for (let k = j; k > i; k--) {
          const old = cols[k].value;
          lend(k);
          receive(k - 1);
          const afterText = k - 1 === i
            ? `Nu har vi 10 + ${before} = ${col.value} ${PLACE[i]}.`
            : `Nu finns det 10 ${PLACE[k - 1]}.`;
          push({
            type: 'exchange',
            title: `Växla 1 ${PLACE[k]} till 10 ${PLACE[k - 1]}`,
            description: `Stryk ${old}:an och skriv ${cols[k].value} ovanför. Skriv 10 ovanför ${definite(k - 1)}. ${afterText}`,
            active: i,
          });
        }
      }
    }

    const v = col.value;
    const r = v - b;
    const leadingZero = i >= answerLength;
    result[i] = leadingZero ? null : r;

    let description;
    if (col.bottom === null) {
      description = leadingZero
        ? `Här finns 0 ${PLACE[i]} kvar och inget att ta bort. En nolla först i svaret skriver vi inte.`
        : `Det finns inget att ta bort i ${definite(i)}. Flytta ner ${v} till svaret.`;
    } else {
      description = leadingZero
        ? `${v} − ${b} = 0. En nolla först i svaret skriver vi inte.`
        : `${v} − ${b} = ${r}. Skriv ${r} under strecket.`;
    }

    push({
      type: 'subtract',
      title: `Räkna ${definite(i)}`,
      description,
      active: i,
    });
  });

  push({
    type: 'check',
    title: 'Kontrollera svaret',
    description: `Kontrollera med addition: ${answer} + ${bottom} = ${top}`,
  });

  push({
    type: 'result',
    title: 'Svar:',
    description: `${top} − ${bottom} = ${answer}`,
  });

  return steps;
}

function SubtractionGrid({ step, stepIndex }) {
  const n = step.cols.length;
  const order = [...Array(n).keys()].reverse();
  const isFinal = step.type === 'check' || step.type === 'result';
  const isActive = (i) => i === step.active;

  return (
    <div className="sb-grid" style={{ gridTemplateColumns: `repeat(${n + 1}, var(--cell))` }}>
      <div />
      {order.map((i) => (
        <div key={`m${i}`} className="sb-marks">
          {step.cols[i].marks.map((m, k) => (
            <span
              key={k}
              className={`sb-mark ${m.crossed ? 'crossed' : ''} ${m.stepId === stepIndex ? 'new' : ''}`}
            >
              {m.text}
            </span>
          ))}
        </div>
      ))}

      <div />
      {order.map((i) => (
        <div key={`t${i}`} className={`digit sb-top ${isActive(i) ? 'active-digit' : ''}`}>
          <span className={step.cols[i].digitCrossed ? 'sb-crossed' : ''}>{step.cols[i].digit}</span>
        </div>
      ))}

      <div className="digit operator">−</div>
      {order.map((i) =>
        step.cols[i].bottom === null ? (
          <div key={`b${i}`} />
        ) : (
          <div key={`b${i}`} className={`digit sb-bottom ${isActive(i) ? 'active-digit' : ''}`}>
            {step.cols[i].bottom}
          </div>
        )
      )}

      <div className="sb-line" />

      <div />
      {order.map((i) =>
        step.result[i] === null ? (
          <div key={`r${i}`} />
        ) : (
          <div
            key={`r${i}`}
            className={`digit sb-result ${isFinal ? 'final' : ''} ${step.type === 'subtract' && isActive(i) ? 'active-digit' : ''}`}
          >
            {step.result[i]}
          </div>
        )
      )}
    </div>
  );
}

export default function SubtractionTeacher() {
  const [initial] = useState(generateRandomProblem);
  const [topInput, setTopInput] = useState(initial.top);
  const [bottomInput, setBottomInput] = useState(initial.bottom);
  const [currentStep, setCurrentStep] = useState(0);

  const problem = buildProblem(topInput, bottomInput);
  const steps = problem.error ? [] : buildSteps(problem.top, problem.bottom);
  const step = steps[currentStep];

  return (
    <div className="teacher subtraction-teacher">
      <header>
        <h1>Subtraktion steg för steg</h1>
        <p>Uppställning med växling</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="sub-top">Första talet:</label>
          <input
            id="sub-top"
            type="text"
            inputMode="numeric"
            value={topInput}
            onChange={(e) => {
              setTopInput(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="512"
          />
        </div>
        <div className="multiply-symbol">−</div>
        <div className="input-group">
          <label htmlFor="sub-bottom">Andra talet:</label>
          <input
            id="sub-bottom"
            type="text"
            inputMode="numeric"
            value={bottomInput}
            onChange={(e) => {
              setBottomInput(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="39"
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
            {step.show && <SubtractionGrid step={step} stepIndex={currentStep} />}
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
