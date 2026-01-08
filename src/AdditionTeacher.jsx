import { useState } from 'react';
import './AdditionTeacher.css';

export default function AdditionTeacher() {
  // Generate random numbers for addition
  const generateRandomNumbers = () => {
    const firstNum = Math.floor(Math.random() * (9999 - 10 + 1)) + 10;   // 10-9999
    const secondNum = Math.floor(Math.random() * (9999 - 10 + 1)) + 10;  // 10-9999
    
    // Ensure the larger number is num1 (top)
    if (firstNum >= secondNum) {
      return { num1: firstNum.toString(), num2: secondNum.toString() };
    } else {
      return { num1: secondNum.toString(), num2: firstNum.toString() };
    }
  };

  const initialNumbers = generateRandomNumbers();
  const [num1, setNum1] = useState(initialNumbers.num1);
  const [num2, setNum2] = useState(initialNumbers.num2);
  const [currentStep, setCurrentStep] = useState(0);

  // Parse numbers and ensure num1 is always the larger number
  let topNum = parseInt(num1) || 0;
  let bottomNum = parseInt(num2) || 0;
  
  // Swap if necessary to keep larger number on top
  if (bottomNum > topNum) {
    [topNum, bottomNum] = [bottomNum, topNum];
  }
  
  const displayNum1 = topNum.toString();
  const displayNum2 = bottomNum.toString();
  const result = topNum + bottomNum;

  // Calculate steps for Swedish addition method
  const calculateSteps = () => {
    const steps = [];
    const digits1 = displayNum1.split('').reverse(); // Reverse to start from ones place
    const digits2 = displayNum2.split('').reverse();
    const maxLength = Math.max(digits1.length, digits2.length);
    
    // Step 0: Show the problem
    steps.push({
      title: 'Vi ska räkna ut:',
      description: `${displayNum1} + ${displayNum2}`,
      type: 'intro'
    });

    // Step 1: Show setup
    steps.push({
      title: 'Sätt upp talen:',
      description: 'Skriv det större talet ovanför det mindre talet, högerställt',
      type: 'setup'
    });

    let carry = 0;
    const resultDigits = [];
    const carries = []; // Track carries for each position

    // Process each column from right to left
    for (let i = 0; i < maxLength || carry > 0; i++) {
      const digit1 = i < digits1.length ? parseInt(digits1[i]) : 0;
      const digit2 = i < digits2.length ? parseInt(digits2[i]) : 0;
      const sum = digit1 + digit2 + carry;
      const resultDigit = sum % 10;
      const newCarry = Math.floor(sum / 10);

      const positionNames = ['ental', 'tiotal', 'hundratal', 'tusental', 'tiotusental'];
      const positionName = positionNames[i] || `position ${i}`;

      let description = '';
      if (digit1 > 0 && digit2 > 0) {
        description = `${digit1} + ${digit2}`;
      } else if (digit1 > 0) {
        description = `${digit1}`;
      } else if (digit2 > 0) {
        description = `${digit2}`;
      } else {
        description = '0';
      }

      if (carry > 0) {
        description += ` + ${carry} (överföring)`;
      }
      
      description += ` = ${sum}. Skriv ${resultDigit} som ${positionName}`;
      
      if (newCarry > 0) {
        description += ` och för över ${newCarry}`;
      }

      steps.push({
        title: `Addera i ${positionName}kolumnen`,
        description: description,
        type: 'add-column',
        columnIndex: i,
        digit1: digit1,
        digit2: digit2,
        carry: carry,
        sum: sum,
        resultDigit: resultDigit,
        newCarry: newCarry,
        carries: [...carries], // Store current carries
        resultDigits: [...resultDigits, resultDigit]
      });

      resultDigits.push(resultDigit);
      
      if (newCarry > 0) {
        carries[i + 1] = newCarry;
      }
      
      carry = newCarry;
    }

    // Final step: Show complete result
    steps.push({
      title: 'Klart!',
      description: `${displayNum1} + ${displayNum2} = ${result}`,
      type: 'result',
      resultDigits: resultDigits
    });

    return steps;
  };

  const steps = calculateSteps();
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    const newNumbers = generateRandomNumbers();
    setNum1(newNumbers.num1);
    setNum2(newNumbers.num2);
    setCurrentStep(0);
  };

  // Get visible result digits up to current step
  const getVisibleResult = () => {
    if (currentStepData.type === 'intro' || currentStepData.type === 'setup') {
      return [];
    }
    if (currentStepData.type === 'result') {
      return currentStepData.resultDigits;
    }
    if (currentStepData.type === 'add-column') {
      return currentStepData.resultDigits;
    }
    return [];
  };

  // Get current carries to display
  const getCurrentCarries = () => {
    if (currentStepData.type === 'add-column') {
      const carries = [];
      const maxLength = Math.max(displayNum1.length, displayNum2.length);
      
      // Show carries for columns we've already processed
      for (let i = 0; i <= maxLength; i++) {
        if (i <= currentStepData.columnIndex && currentStepData.carries && currentStepData.carries[i]) {
          carries[i] = {
            value: currentStepData.carries[i],
            used: i < currentStepData.columnIndex
          };
        }
        if (i === currentStepData.columnIndex + 1 && currentStepData.newCarry > 0) {
          carries[i] = {
            value: currentStepData.newCarry,
            used: false,
            isNew: true
          };
        }
      }
      return carries;
    }
    return [];
  };

  const visibleResult = getVisibleResult();
  const carries = getCurrentCarries();

  // Render the addition layout
  const renderAddition = () => {
    if (currentStepData.type === 'intro') {
      return null;
    }

    const digits1 = displayNum1.split('');
    const digits2 = displayNum2.split('');
    const maxLength = Math.max(digits1.length, digits2.length);

    // Pad numbers to same length for display
    while (digits1.length < maxLength) digits1.unshift(' ');
    while (digits2.length < maxLength) digits2.unshift(' ');

    return (
      <div className="addition-container">
        {/* Addition grid */}
        <div className="addition-grid">
          {/* Carry row - always visible, integrated in grid */}
          <div className="carry-section">
            <div className="carry-label">Överföringar:</div>
            <div className="number-row carry-number-row">
              {[...Array(maxLength + 1)].map((_, i) => {
                const carryIndex = maxLength - i;
                const carry = carries[carryIndex];
                return (
                  <div 
                    key={i} 
                    className={`digit carry-digit ${carry ? (carry.used ? 'used' : carry.isNew ? 'new-carry' : '') : 'empty'}`}
                  >
                    {carry ? carry.value : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* First number */}
          <div className="number-row top-number">
            <div className="digit empty"></div>
            {digits1.map((d, i) => {
              const columnIndex = maxLength - 1 - i;
              const isActive = currentStepData.type === 'add-column' && 
                             currentStepData.columnIndex === columnIndex &&
                             d !== ' ';
              return (
                <div 
                  key={i} 
                  className={`digit ${isActive ? 'active-digit' : ''} ${d === ' ' ? 'empty' : ''}`}
                >
                  {d !== ' ' ? d : ''}
                </div>
              );
            })}
          </div>

          {/* Plus sign and second number */}
          <div className="number-row bottom-number">
            <div className="digit operator">+</div>
            {digits2.map((d, i) => {
              const columnIndex = maxLength - 1 - i;
              const isActive = currentStepData.type === 'add-column' && 
                             currentStepData.columnIndex === columnIndex &&
                             d !== ' ';
              return (
                <div 
                  key={i} 
                  className={`digit ${isActive ? 'active-digit' : ''} ${d === ' ' ? 'empty' : ''}`}
                >
                  {d !== ' ' ? d : ''}
                </div>
              );
            })}
          </div>

          {/* Line */}
          <div className="number-row line-row">
            <div className="digit empty"></div>
            <div className="line"></div>
          </div>

          {/* Result */}
          {visibleResult.length > 0 && (
            <div className="number-row result-row">
              <div className="digit empty"></div>
              {visibleResult.slice().reverse().map((d, i) => {
                const columnIndex = visibleResult.length - 1 - i;
                const isNew = currentStepData.type === 'add-column' && 
                            columnIndex === currentStepData.columnIndex;
                return (
                  <div 
                    key={i} 
                    className={`digit ${isNew ? 'active-digit' : ''}`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="addition-teacher">
      <div className="teacher-card">
        <header>
          <h1>Addition - Svensk metod</h1>
          <p>Lär dig ställa upp och lösa addition steg för steg</p>
        </header>

        <div className="input-section">
          <div className="input-group">
            <label>Första talet:</label>
            <input
              type="number"
              value={num1}
              onChange={(e) => {
                setNum1(e.target.value);
                setCurrentStep(0);
              }}
            />
          </div>
          <div className="plus-symbol">+</div>
          <div className="input-group">
            <label>Andra talet:</label>
            <input
              type="number"
              value={num2}
              onChange={(e) => {
                setNum2(e.target.value);
                setCurrentStep(0);
              }}
            />
          </div>
        </div>

        <div className="step-info">
          <h2>{currentStepData.title}</h2>
          <p>{currentStepData.description}</p>
        </div>

        <div className="visualization">
          {renderAddition()}
        </div>

        <div className="controls">
          <button 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
            className="control-btn"
          >
            ← Föregående
          </button>
          <div className="step-counter">
            Steg {currentStep + 1} av {steps.length}
          </div>
          <button 
            onClick={handleNext} 
            disabled={currentStep === steps.length - 1}
            className="control-btn"
          >
            Nästa →
          </button>
        </div>

        <div className="reset-section">
          <button onClick={handleReset} className="reset-btn">
            🎲 Nya slumptal
          </button>
        </div>
      </div>
    </div>
  );
}
