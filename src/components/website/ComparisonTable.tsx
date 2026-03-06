import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

const features = [
  { feature: "No waiting in line", skaap: true, selfCheckout: false, traditional: false },
  { feature: "Scan while you shop", skaap: true, selfCheckout: false, traditional: false },
  { feature: "Pay from your phone", skaap: true, selfCheckout: false, traditional: false },
  { feature: "No hardware needed", skaap: true, selfCheckout: false, traditional: true },
  { feature: "Real-time running total", skaap: true, selfCheckout: "partial", traditional: false },
  { feature: "Average checkout time", skaap: "< 30s", selfCheckout: "3-5 min", traditional: "8-15 min" },
  { feature: "Customer satisfaction", skaap: "94%", selfCheckout: "61%", traditional: "72%" },
  { feature: "Setup cost for stores", skaap: "$0", selfCheckout: "$30K+", traditional: "$5K+" },
];

const CellContent = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Check size={18} className="text-success mx-auto" />;
  if (value === false) return <X size={18} className="text-destructive/50 mx-auto" />;
  if (value === "partial") return <Minus size={18} className="text-muted-foreground mx-auto" />;
  return <span className="text-sm font-semibold">{value}</span>;
};

const ComparisonTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"></th>
            <th className="py-3 px-4 text-center">
              <div className="bg-primary text-primary-foreground rounded-xl py-2 px-3 text-sm font-bold">
                SKAAP
              </div>
            </th>
            <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">Self-Checkout</th>
            <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">Traditional</th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-border last:border-0"
            >
              <td className="py-3 px-4 text-sm text-foreground font-medium">{row.feature}</td>
              <td className="py-3 px-4 text-center bg-primary/5">
                <CellContent value={row.skaap} />
              </td>
              <td className="py-3 px-4 text-center">
                <CellContent value={row.selfCheckout} />
              </td>
              <td className="py-3 px-4 text-center">
                <CellContent value={row.traditional} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
