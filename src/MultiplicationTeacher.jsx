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

    // Calculate each partial product
    multiplierDigits.forEach((digit, index) => {
      const digitValue = parseInt(digit);
      const partialProduct = multiplicand * digitValue;
      
      steps.push({
        title: `Steg ${index + 1}: Multiplicera med ${digit}`,
        description: `${num1} × ${digit} = ${partialProduct}`,
        digit: digit,
        position: index,
        partialProduct: partialProduct,
        type: 'multiply'
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

  // Calculate all partial products for display
  const getPartialProducts = () => {
    const products = [];
    const multiplierDigits = num2.split('').reverse();
    
    multiplierDigits.forEach((digit, index) => {
      const digitValue = parseInt(digit);
      const partialProduct = multiplicand * digitValue;
      products.push({
        value: partialProduct,
        position: index,
        digit: digitValue
      });
    });
    
    return products;
  };

  const partialProducts = getPartialProducts();

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
    return (
      <div className="visualization">
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

          {/* Show partial products based on current step */}
          {currentStep >= 3 && partialProducts.map((product, idx) => {
            const shouldShow = currentStep >= 3 + idx;
            const isHighlighted = currentStep === 3 + idx;
            
            if (!shouldShow) return null;

            const productStr = product.value.toString();
            const paddingZeros = '0'.repeat(product.position);
            
            return (
              <div 
                key={idx} 
                className={`number-row partial-product ${isHighlighted ? 'highlighted' : ''}`}
              >
                {productStr.split('').map((digit, i) => (
                  <div key={i} className="digit">{digit}</div>
                ))}
                {paddingZeros.split('').map((zero, i) => (
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
