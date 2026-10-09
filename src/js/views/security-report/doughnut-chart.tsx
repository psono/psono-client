import { ArcElement, Chart, Tooltip } from "chart.js";

Chart.register(ArcElement, Tooltip);

export { Doughnut as default } from "react-chartjs-2";
