import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  calls: number;
  successful: number;
}

interface ChartProps {
  data: ChartData[];
  title: string;
}

const Chart: React.FC<ChartProps> = ({ data, title }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="calls" 
          stroke="#8884d8" 
          name="Total Calls"
        />
        <Line 
          type="monotone" 
          dataKey="successful" 
          stroke="#82ca9d" 
          name="Successful Calls"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Chart; 