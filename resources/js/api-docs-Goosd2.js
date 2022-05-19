// full screen button

const full_screen=document.querySelector(".full_screen");
const fixpage=document.querySelector(".fixpage");
const wrap1=document.querySelector(".main-content").firstElementChild;
const right_col=document.querySelector(".api-right-col");
var left_menu=document.querySelector(".api-left-col");
var left_section = document.querySelector("#left_section");

var wrap_element = document.getElementById("wrap");
var mainfooter = document.getElementById("main-footer");

left_menu.style.width = left_section.style.width+"px";

full_screen.addEventListener('click',()=>{
  fixpage.classList.toggle("Big-wrap");
  wrap_element.classList.add("Big-wrap");
  mainfooter.classList.add("Footer-wrap");
  if( full_screen.firstElementChild.innerHTML!="Restore View"){
    full_screen.firstElementChild.innerHTML="Restore View";
  }
  else{
    full_screen.firstElementChild.innerHTML="Full Screen";
    wrap_element.classList.remove("Big-wrap");
    mainfooter.classList.remove("Footer-wrap");
  }
})


setTimeout(()=>{
  full_screen.firstElementChild.classList.add("minimize");
},6000)






// left section links tree

const parent_menu=document.querySelectorAll(".parent_menu");
for(let link_count=0;link_count<parent_menu.length;link_count++){
    parent_menu[link_count].previousElementSibling.addEventListener("click",()=>{
        parent_menu[link_count].nextElementSibling.classList.toggle("notVisible")  
        if(parent_menu[link_count].nextElementSibling.classList.contains("notVisible")){
            parent_menu[link_count].nextElementSibling.style.display="none";     
        }    
        else{
            parent_menu[link_count].nextElementSibling.style.display="block";       

        } 
        
    })
}
