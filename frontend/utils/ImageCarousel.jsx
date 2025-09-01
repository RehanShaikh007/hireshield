import { useEffect, useState } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import secureImg from "/secure.png"
import verifiedImg from "/verified.png"
import complaintImg from "/complaint.png"

const ImageCarousel = () => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
      setIsMounted(true)
    }, [])
    const images = [secureImg, verifiedImg, complaintImg];
  
    const settings = {
      dots: false,
      infinite: true,
      autoplay: true,
      speed: 600,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplaySpeed: 3000,
      arrows: false,
      adaptiveHeight: false,
      lazyLoad: "ondemand",
      fade: true,
    };
  
    if (!isMounted) return null

    return (
      <div className="hero-carousel h-full">
      <Slider {...settings} className="h-full">
        {images.map((src, i) => (
          <div key={i} className="flex justify-center items-center h-full">
            <img src={src} alt={`slide-${i}`} className="w-full h-full max-h-full object-contain drop-shadow-xl" />
          </div>
        ))}
      </Slider>
      </div>
    );
  };
  
  export default ImageCarousel;