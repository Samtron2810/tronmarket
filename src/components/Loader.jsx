import React from "react";
import Skeleton from "./Skeleton";

const Loader = () => (
  <div className="py-6 text-center">
    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  </div>
);

export default Loader;
