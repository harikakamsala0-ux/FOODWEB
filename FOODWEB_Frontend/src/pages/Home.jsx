import { useState } from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import RestaurantSection from "../components/RestaurantSection";
import Offers from "../components/Offers";
import WhyFoodWeb from "../components/WhyFoodWeb";
//import LocationSection from "../components/LocationSection";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";

import "../App.css";

function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Pizza");

  return (
    <div className="foodweb">

      

      <main>

        <Hero
          search={search}
          setSearch={setSearch}
        />

        <Categories
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <RestaurantSection
          search={search}
          selectedCategory={selectedCategory}
        />

        <Offers />

        <WhyFoodWeb />

       {/* <LocationSection */}

        <FinalCTA />

      </main>

      <Footer />

    </div>
  );
}

export default Home;