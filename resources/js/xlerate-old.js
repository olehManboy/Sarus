// swiper.js
var swiper = new Swiper(".mySwiper1", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
       enabled: true,
     },

     loop: true,
     
    autoplay: {
      delay: 9000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next1",
      prevEl: ".swiper-button-prev1",
    },
  });




  var swiper = new Swiper(".mySwiper2", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
       enabled: true,
     },

     loop: true,
     
    autoplay: {
      delay: 12000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next2",
      prevEl: ".swiper-button-prev2",
    },
  });




  var swiper = new Swiper(".mySwiper3", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
       enabled: true,
     },

     loop: true,
     
    autoplay: {
      delay: 12000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next3",
      prevEl: ".swiper-button-prev3",
    },
  });




  var swiper = new Swiper(".mySwiper4", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
       enabled: true,
     },

     loop: true,
     
    autoplay: {
      delay: 10000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next4",
      prevEl: ".swiper-button-prev4",
    },
  });




const body=document.querySelector("body");
const navbar_default=document.querySelector(".navbar-default");
const modelView=document.querySelector(".modelView");
const modelViewImg=document.querySelector(".model-content img");
const swiper_container=document.querySelectorAll(".swiper-container");
const nav=document.querySelector("nav");
const cross=document.querySelector(".cross");
const xlerate_image=document.querySelectorAll(".xlerate-image img")
const xlerate_imageBox=document.querySelectorAll(".xlerate-image");
const blackbackground=document.querySelector(".blackbackground");
const tooltip_att=["data-bs-toggle", "data-bs-placement","data-bs-html", "title"]
const tooltip_att_values=["tooltip","right","true","Double click to view the image"]


window.addEventListener("load",()=>{
    body.style.background="#ececec";
    
})
modelView.style.display="none"



cross.addEventListener("click",()=>{
    modelView.classList.remove("modalVisible");
    modelView.style.display="none";
    cross.style.display="none";
})	






const allImages=document.querySelectorAll(".info-monitor img")


for(let i=0;i<allImages.length;i++){
        for(let j=0;j<tooltip_att.length;j++){
        allImages[i].setAttribute(tooltip_att[j],tooltip_att_values[j])
    }
}

console.log(swiper_container)

for( let yy=0;yy<allImages.length;yy++){
        allImages[yy].addEventListener("dblclick",()=>{
        let ImageSource=allImages[yy]
        modelView.classList.add("modalVisible");
        
        modelView.style.display="block";
        modelViewImg.src=`${ImageSource.getAttribute('src')}`
        cross.style.display="flex";
    })
}




