import { useState } from 'react';
import './MultiplicationTeacher.css';

function MultiplicationTeacher() {
  const [num1, setNum1] = useState('413');
  const [num2, setNum2] = useState('12');
  const [currentStep, setCurrentStep] = useState(0);

  // Parse numbers
  const multiplicand = parseInt(num1) || 0;
  const multiplier = parseInt(num2) || 0;
  const result = multiplicand * multiplier;

  // Calculate steps for Swedish method (column multiplication)
  const calculateSteps = () => {
    const steps = [];
    const multiplierDigits = num2.split('').reverse();
    const multiplicandDigits = num1.split('').reverse();
    
    // Step 0: Show the problem
    steps.push({
      title: 'Vi ska räkna ut:',
      description: `${num1} × ${num2}`,
      type: 'intro'
    });

    // Step 1: Show setup
    steps.push({
      title: 'Sätt upp talet:',
      description: 'Skriv det större talet ovanför det mindre talet, högerställt',
      type: 'setup'
    });

    // Create granular steps for each multiplier digit
    multiplierDigits.forEach((multiplierDigit, rowIndex) => {
      const digit = parseInt(multiplierDigit);
      let carry = 0;
      const resultDigits = [];
      const carries = [];

      // For each digit in multiplicand (right to left)
      multiplicandDigits.forEach((multiplicandDigit, digitIndex) => {
        const mDigit = parseInt(multiplicandDigit);
        const product = mDigit * digit + carry;
        const resultDigit = product % 10;
        const newCarry = Math.floor(product / 10);

        resultDigits.push(resultDigit);
        
        // Create a step for this individual multiplication
        const positionName = ['ental', 'tiotal', 'hundratal', 'tusental', 'tiotusental'][digitIndex] || `position ${digitIndex}`;
        const multiplicandDigitName = num1[num1.length - 1 - digitIndex];
        
        let description = `${multiplicandDigitName} × ${digit} = ${mDigit * digit}`;
        if (carry > 0) {
          description += ` + ${carry} (rest) = ${product}`;
        }
        description += `. Skriv ${resultDigit} som ${positionName}`;
        if (newCarry > 0) {
          description += ` och rest ${newCarry}`;
        }

        steps.push({
          title: `Multiplicera ${multiplicandDigitName} × ${digit}`,
          description: description,
          type: 'multiply-digit',
          rowIndex: rowIndex,
          digitIndex: digitIndex,
          multiplierDigit: digit,
          multiplicandDigit: mDigit,
          previousCarry: carry,
          product: product,
          resultDigit: resultDigit,
          newCarry: newCarry,
          resultDigits: [...resultDigits],
          carries: newCarry > 0 ? [...carries, newCarry] : [...carries]
        });

        carries.push(newCarry);
        carry = newCarry;
      });
    });

    // Final step: Add all partial products
    steps.push({
      title: 'Sista steget: Addera alla delprodukter',
      description: 'Lägg ihop alla rader uppifrån och ner',
      type: 'sum'
    });

    // Show result
    steps.push({
      title: 'Svar:',
      description: `${num1} × ${num2} = ${result}`,
      type: 'result'
    });

    return steps;
  };

  const steps = calculateSteps();

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSteps = () => {
    setCurrentStep(0);
  };

  // Render the multiplication visualization
  const renderVisualization = () => {
    const currentStepData = steps[currentStep];
    
    // Get carries to display
    const getCurrentCarries = () => {
      if (currentStepData.type === 'multiply-digit') {
        return currentStepData.carries.filter(c => c > 0).map((value, idx) => ({
          value: value,
          used: idx < currentStepData.digitIndex
        }));
      }
      return [];
    };

    // Get partial products to display based on current step
    const getVisiblePartialProducts = () => {
      const products = [];
      const multiplierDigits = num2.split('').reverse();
      
      multiplierDigits.forEach((digit, rowIndex) => {
        // Find the last multiply-digit step for this row that we've completed
        let lastCompletedDigitIndex = -1;
        const resultDigits = [];
        
        for (let i = 0; i <= currentStep; i++) {
          const step = steps[i];
          if (step.type === 'multiply-digit' && step.rowIndex === rowIndex) {
            lastCompletedDigitIndex = step.digitIndex;
            // Build up the result digits from all completed steps in this row
            if (step.resultDigits) {
              step.resultDigits.forEach((d, idx) => {
                resultDigits[idx] = d;
              });
            }
          }
        }
        
        if (lastCompletedDigitIndex >= 0) {
          // Show the partial result built so far
          const paddingZeros = '0'.repeat(rowIndex);
          products.push({
            digits: resultDigits.slice(0, lastCompletedDigitIndex + 1).reverse(),
            paddingZeros: paddingZeros,
            isComplete: lastCompletedDigitIndex >= num1.length - 1,
            rowIndex: rowIndex
          });
        }
      });
      
      return products;
    };

    const currentCarries = getCurrentCarries();
    const visibleProducts = getVisiblePartialProducts();
    
    return (
      <div className="visualization">
        <div className="multiplication-container">
          {/* Show carry digits above the calculation */}
          {currentCarries.length > 0 && (
            <div className="carry-row">
              <span className="carry-label">Rest:</span>
              {currentCarries.map((carry, idx) => (
                <div 
                  key={idx} 
                  className={`carry-digit ${carry.used ? 'used' : ''}`}
                >
                  {carry.value}
                </div>
              ))}
            </div>
          )}
          
          <div className="multiplication-grid">
            {/* Show multiplicand */}
            <div className="number-row multiplicand">
              {num1.split('').map((digit, i) => (
                <div key={i} className="digit">{digit}</div>
              ))}
            </div>

            {/* Show multiplication sign and multiplier */}
            <div className="number-row multiplier">
              <div className="digit operator">×</div>
              {num2.split('').map((digit, i) => (
                <div key={i} className="digit">{digit}</div>
              ))}
            </div>

            {/* Show line */}
            <div className="division-line"></div>

            {/* Show partial products being built up */}
            {visibleProducts.map((product, idx) => {
              const isActive = currentStepData.type === 'multiply-digit' && 
                             currentStepData.rowIndex === product.rowIndex;
              
              return (
                <div 
                  key={idx} 
                  className={`number-row partial-product ${isActive ? 'highlighted' : ''}`}
                >
                  {product.digits.map((digit, i) => (
                    <div key={i} className="digit">{digit}</div>
                  ))}
                  {product.paddingZeros.split('').map((zero, i) => (
                    <div key={`zero-${i}`} className="digit zero">{zero}</div>
                  ))}
                </div>
              );
            })}

          {/* Show sum line and result */}
          {currentStep >= steps.length - 2 && (
            <>
              <div className="division-line"></div>
              <div className="number-row result-row highlighted">
                {result.toString().split('').map((digit, i) => (
                  <div key={i} className="digit">{digit}</div>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="multiplication-teacher">
      <header>
        <h1>🧮 Multiplikation Steg-för-Steg</h1>
        <p>Lär dig multiplicera som i svenska grundskolan!</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="num1">Första talet:</label>
          <input
            id="num1"
            type="number"
            value={num1}
            onChange={(e) => {
              setNum1(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="413"
          />
        </div>
        <div className="multiply-symbol">×</div>
        <div className="input-group">
          <label htmlFor="num2">Andra talet:</label>
          <input
            id="num2"
            type="number"
            value={num2}
            onChange={(e) => {
              setNum2(e.target.value);
              setCurrentStep(0);
            }}
            placeholder="12"
          />
        </div>
      </div>

      <div className="step-info">
        <h2>{steps[currentStep].title}</h2>
        <p>{steps[currentStep].description}</p>
      </div>

      {renderVisualization()}

      <div className="controls">
        <button 
          onClick={prevStep} 
          disabled={currentStep === 0}
          className="btn btn-prev"
        >
          ← Föregående
        </button>
        <button 
          onClick={resetSteps}
          className="btn btn-reset"
        >
          ↺ Börja om
        </button>
        <button 
          onClick={nextStep} 
          disabled={currentStep === steps.length - 1}
          className="btn btn-next"
        >
          Nästa →
        </button>
      </div>

      <div className="progress">
        Steg {currentStep + 1} av {steps.length}
      </div>
    </div>
  );
}

export default MultiplicationTeacher;
