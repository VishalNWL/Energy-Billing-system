export interface AuditScore {
  loadFactorScore: number;
  powerFactorScore: number;
  solarScore: number;
  demandScore: number;
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface EnergyRecommendation {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  description: string;
  estimatedSavingsPercent: number;
}

export function calculateAuditScore(params: {
  loadFactor: number;
  avgPowerFactor: number;
  hasSolar: boolean;
  isWithinContractedDemand: boolean;
  lossPercent: number;
}): AuditScore {
  const {
    loadFactor,
    avgPowerFactor,
    hasSolar,
    isWithinContractedDemand,
    lossPercent,
  } = params;

  const loadFactorScore =
    loadFactor >= 0.8 ? 20 : loadFactor >= 0.6 ? 15 : loadFactor >= 0.4 ? 8 : 3;

  const powerFactorScore =
    avgPowerFactor >= 0.95
      ? 20
      : avgPowerFactor >= 0.9
      ? 15
      : avgPowerFactor >= 0.85
      ? 10
      : 5;

  const solarScore = hasSolar ? 20 : 0;

  const demandScore = isWithinContractedDemand ? 20 : 5;

  const lossScore =
    lossPercent < 5 ? 20 : lossPercent < 10 ? 15 : lossPercent < 15 ? 8 : 3;

  const total =
    loadFactorScore +
    powerFactorScore +
    solarScore +
    demandScore +
    lossScore;

  const grade: AuditScore["grade"] =
    total >= 85
      ? "A"
      : total >= 70
      ? "B"
      : total >= 55
      ? "C"
      : total >= 40
      ? "D"
      : "F";

  return {
    loadFactorScore,
    powerFactorScore,
    solarScore,
    demandScore,
    total,
    grade,
  };
}

export function generateRecommendations(params: {
  loadFactor: number;
  avgPowerFactor: number;
  hasSolar: boolean;
  isWithinContractedDemand: boolean;
  consumerType: string;
  peakDemandKW: number;
  avgMonthlyUnits: number;
}): EnergyRecommendation[] {
  const recommendations: EnergyRecommendation[] = [];
  const {
    loadFactor,
    avgPowerFactor,
    hasSolar,
    isWithinContractedDemand,
    consumerType,
    peakDemandKW,
    avgMonthlyUnits,
  } = params;

  // Power factor recommendations
  if (avgPowerFactor < 0.85) {
    recommendations.push({
      id: "pf-critical",
      priority: "HIGH",
      category: "Power Factor",
      title: "Install Capacitor Bank Immediately",
      description: `Current PF of ${avgPowerFactor.toFixed(3)} is critically low. 
        Install capacitor bank per Step 11 calculation to eliminate penalty 
        charges and reduce apparent power demand.`,
      estimatedSavingsPercent: 15,
    });
  } else if (avgPowerFactor < 0.9) {
    recommendations.push({
      id: "pf-warning",
      priority: "MEDIUM",
      category: "Power Factor",
      title: "Improve Power Factor to Avoid Penalty",
      description: `PF of ${avgPowerFactor.toFixed(3)} is below the 0.9 threshold. 
        Consider adding capacitor banks to reach at least 0.95 PF.`,
      estimatedSavingsPercent: 8,
    });
  }

  // Load factor recommendations
  if (loadFactor < 0.5) {
    recommendations.push({
      id: "lf-poor",
      priority: "HIGH",
      category: "Load Management",
      title: "Implement Load Scheduling",
      description: `Load factor of ${loadFactor} indicates highly irregular consumption. 
        Shift non-critical loads to off-peak hours (10PM–6AM) to flatten 
        the load curve and reduce maximum demand charges.`,
      estimatedSavingsPercent: 20,
    });
  } else if (loadFactor < 0.7) {
    recommendations.push({
      id: "lf-medium",
      priority: "MEDIUM",
      category: "Load Management",
      title: "Optimize Load Distribution",
      description: `Load factor of ${loadFactor} can be improved by spreading 
        energy-intensive operations across the day rather than concentrating 
        them in peak hours.`,
      estimatedSavingsPercent: 10,
    });
  }

  // Solar recommendations
  if (!hasSolar) {
    const estimatedCapacity = Math.min(
      Math.ceil(avgMonthlyUnits / 150),
      50
    );
    recommendations.push({
      id: "solar",
      priority:
        consumerType === "INDUSTRIAL" || consumerType === "COMMERCIAL"
          ? "HIGH"
          : "MEDIUM",
      category: "Renewable Energy",
      title: "Install Rooftop Solar System",
      description: `Based on average consumption of ${avgMonthlyUnits.toFixed(0)} kWh/month, 
        a ${estimatedCapacity} kW solar system could offset 30–40% of consumption, 
        significantly reducing bills and carbon footprint.`,
      estimatedSavingsPercent: 35,
    });
  }

  // Demand management
  if (!isWithinContractedDemand) {
    recommendations.push({
      id: "demand-exceed",
      priority: "HIGH",
      category: "Demand Management",
      title: "Reduce Peak Demand or Revise Contract",
      description: `Maximum demand is exceeding contracted limit, 
        triggering excess demand penalties. Either implement demand 
        controllers/timers to cap peak load, or revise contracted demand 
        with DISCOM.`,
      estimatedSavingsPercent: 12,
    });
  }

  // ToD optimization
  if (consumerType !== "RESIDENTIAL") {
    recommendations.push({
      id: "tod",
      priority: "LOW",
      category: "Tariff Optimization",
      title: "Shift Loads to Off-Peak ToD Slot",
      description: `Reschedule energy-intensive processes to off-peak hours 
        (10PM–6AM at ₹5/unit) from peak hours (6PM–10PM at ₹9/unit). 
        A 20% load shift can yield significant savings.`,
      estimatedSavingsPercent: 8,
    });
  }

  // LED lighting
  recommendations.push({
    id: "led",
    priority: "LOW",
    category: "Energy Efficiency",
    title: "Upgrade to LED Lighting",
    description: `Replace conventional lighting with LED fixtures. 
      LED lights consume 60–70% less energy and last 10× longer, 
      reducing both energy bills and maintenance costs.`,
    estimatedSavingsPercent: 5,
  });

  return recommendations.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.priority] - order[b.priority];
  });
}