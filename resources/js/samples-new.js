let python_files = [
    {btn_name: "Python product1",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product2",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: false},
    {btn_name: "Python product3",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product4",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product5",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product7",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product8",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product9",  description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product10", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product11", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product12", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product13", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product14", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product15", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product16", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product17", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product18", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product19", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product20", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true}
    {btn_name: "Python product21", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product22", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product23", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product24", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product25", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product26", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product27", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product28", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product29", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product30", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Python product31", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true}
];



let r_files = [
    {btn_name: "R product1", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product2", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: false},
    {btn_name: "R product3", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product4", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product5", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product6", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product7", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product8", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product9", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "R product10", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true}
]

let jupyter_files = [
    {btn_name: "Jupyter product1", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: false},
    {btn_name: "Jupyter product2", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: false},
    {btn_name: "Jupyter product3", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product4", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product5", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product6", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product7", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product8", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product9", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true},
    {btn_name: "Jupyter product10", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto, ut at vel cum sequi illo iste fugit accusamus explicabo tempore pariatur maxime ducimus asperiores nesciunt quidem, ex aut totam laudantium.", locked: true}
]



let select = document.querySelector('#language-select');
var per_num = 10;

show_grid("python", per_num);
accbtn();

function show_grid(selection, per_num=3, sel_page=1){
    var data;
    if(selection == "python") 
        data = python_files;
    else if(selection == "r")
        data = r_files;
    else
        data = jupyter_files;

    var contents = $('<div>');
    var start = (sel_page-1)*per_num;
    var end = (start+per_num) < data.length ? (start+per_num) : data.length;

    for (var i = start; i < end; i++) {

        var item = $('<div class="accordion-file">');
        var lock_img = (data[i].locked) ? "locked.png" : "unlocked.png";
        var btn_active = (data[i].locked) ? "disabled" : "";
        $('<button class="accordion-btn">'+data[i].btn_name+' <img src="resources/images/'+lock_img+'" alt=""></button>').appendTo(item);
        
        var item_contents = $('<div class="accordion-content">');

        $('<p>'+data[i].description+'</p>').appendTo(item_contents);
        $('<div class="btn-wrapper"><button class="btn '+btn_active+' btn-primary me-4">View</button><button class="btn '+btn_active+' btn-success">Download</button></div>').appendTo(item_contents);

        item_contents.appendTo(item);

        item.appendTo(contents);
    }

    if(selection == "python"){
        $('#python-body').html(contents);
        
    }        
    else if(selection == "r"){
        $('#r-body').html(contents);
    }        
    else{
        $('#jupyter-body').html(contents);
    }

    accbtn();
    pagination(selection, per_num, sel_page);
}

//When select option changes. it Means when user select other options
select.addEventListener("change", function () {
    let pyfiles = document.querySelector('.python-files');
    rfiles = document.querySelector('.r-files');
    jupfiles = document.querySelector('.jupyter-files');
    sIndex = select.selectedIndex;
    accordion = document.querySelector('.accordion-collapse')

    // When python is selected then hide jupyter files and R files
    if (sIndex == 0) {
        pyfiles.style.display = 'block';
        jupfiles.style.display = 'none';
        rfiles.style.display = 'none';
        show_grid("python", per_num);
    }

    // When R is selected then hide jupyter files and Python files. Show R files
    else if (sIndex == 1) {
        rfiles.style.display = 'block';
        pyfiles.style.display = 'none';
        jupfiles.style.display = 'none';
        show_grid("r", per_num);
    }

    // And when Jupyter is selected then hide Python files and R files.Show Jupyter files
    else if (sIndex == 2) {
        jupfiles.style.display = 'block';
        pyfiles.style.display = 'none';
        rfiles.style.display = 'none';
        show_grid("jupyter", per_num);
    }

    accbtn();
});

//this is the accordion button
function accbtn(){
    let accbtn = document.getElementsByClassName("accordion-btn");
    for (let i = 0; i < accbtn.length; i++) {
        //when one of the buttons are clicked run this function
        accbtn[i].onclick = function () {
            //letiables
            let panel = this.nextElementSibling;
            let accContent = document.getElementsByClassName("accordion-content");
            let accActive = document.getElementsByClassName("accordion-btn active");

            /*if pannel is already open - minimize*/
            if (panel.style.maxHeight) {
                //minifies current pannel if already open
                panel.style.maxHeight = null;
                //removes the 'active' class as toggle didnt work on browsers minus chrome
                this.classList.remove("active");
            } else { //pannel isnt open...
                //goes through the buttons and removes the 'active' css (+ and -)
                for (let ii = 0; ii < accActive.length; ii++) {
                    accActive[ii].classList.remove("active");
                }
                //Goes through and removes 'activ' from the css, also minifies any 'panels' that might be open
                for (let iii = 0; iii < accContent.length; iii++) {
                    this.classList.remove("active");
                    accContent[iii].style.maxHeight = null;
                }
                //opens the specified pannel
                panel.style.maxHeight = panel.scrollHeight + "px";
                //adds the 'active' addition to the css.
                this.classList.add("active");
            }
        } //closing to the acc onclick function
    } //closing to the for loop.
}

// form validation check
let sendtBtn = document.querySelector('.send-btn');

sendtBtn.addEventListener('click', function () {
    let nameInput = document.querySelector('.name input');
    companyInput = document.querySelector('.company input');
    messageInput = document.querySelector('.message textarea');

    if (nameInput.value.length < 3) { //if name inputs value is less then 3 character
        // then show the error text
        nameInput.nextElementSibling.style.display = 'block'

    } else if (nameInput.value.length > 3) { //if name inputs value is greater then 3 character
        nameInput.nextElementSibling.style.display = 'none' // then hide the error text
    }
    if (companyInput.value.length < 3) { //if company inputs value is less then 3 character
        companyInput.nextElementSibling.style.display = 'block' // then show the error text

    } else if (companyInput.value.length > 3) { //if Company inputs value is greater then 3 character
        companyInput.nextElementSibling.style.display = 'none' // then hide the error text
    }
    if (messageInput.value.length < 10) { //if message inputs value is less then 3 character
        messageInput.nextElementSibling.style.display = 'block' // then show the error text

    } else if (messageInput.value.length > 10) { //if Company inputs value is greater then 3 character
        messageInput.nextElementSibling.style.display = 'none' // then hide the error text
    }

})

function pagination(selection, per_num=3, sel_page=1){
    var data;
    if(selection == "python")
        data = python_files;
    else if(selection == "r")
        data = r_files;
    else
        data = jupyter_files;

    total_page = Math.ceil(data.length / per_num);
    var pagi = $('<ul class="pagination">');
    var prev = (sel_page == 1) ? "disabled" : "";
    $('<li class="page-item '+prev+'"><a class="page-link" href="javascript:show_grid(\''+selection+'\', '+per_num+', '+(sel_page-1)+')">Previous</a></li>').appendTo(pagi);
    for(var i=1; i<=total_page; i++){
        if(i == sel_page)
            $('<li class="page-item active"><a class="page-link">'+i+'</a></li>').appendTo(pagi);
        else
            $('<li class="page-item"><a class="page-link" href="javascript:show_grid(\''+selection+'\', '+per_num+', '+i+')">'+i+'</a></li>').appendTo(pagi);
    }
    var next = (sel_page == total_page) ? "disabled" : "";
    $('<li class="page-item '+next+'"><a class="page-link" href="javascript:show_grid(\''+selection+'\', '+per_num+', '+(sel_page+1)+')">Next</a></li>').appendTo(pagi);
    
    if(selection == "python"){
        $('#python_pagination').html(pagi);
    }        
    else if(selection == "r"){
        $('#r_pagination').html(pagi);
    }        
    else{
        $('#jupyter_pagination').html(pagi);
    }
}