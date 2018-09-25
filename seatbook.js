seatrows = 0;
seatcols = 0;
var errElem = [];
var errFlag = false;
var editFlag = false;
var serverData = {};
var colData = [];
var rowData = [];

jQuery(document).ready(function(){
    var chkupxx = jQuery('#book-seat').length;
    seatrows = jQuery.trim(jQuery('#seat-rows').val());
    seatcols = jQuery.trim(jQuery('#seat-cols').val());
    
    //只能输入数字编号
	$(".well .sel-hall").on("input propertychange",function(e){
		e.target.value = e.target.value.replace(/\D/g,'');
		if(parseInt(e.target.value) > 50 ){
			e.target.value = 50
		}
	});
	
	$(".hall-modal .add-hall-col").on("input propertychange",function(e){
		e.target.value = e.target.value.replace(/\D/g,'');
		if(parseInt(e.target.value) > 50 ){
			e.target.value = 50
		}
	});
	
	$(".hall-modal .add-hall-row").on("input propertychange",function(e){
		e.target.value = e.target.value.replace(/\D/g,'');
		if(parseInt(e.target.value) > 50 ){
			e.target.value = 50
		}
	});
    
    jQuery('body').on('click','.seat-available', function(){
        var sid = jQuery(this).attr('id');
        toggle_seat_selection(sid);
    });

    jQuery('body').on('click', '.close-floating-box', function(){
        jQuery('body').removeClass('hide-overflow');
        jQuery('.floating-box').remove();
    });

    jQuery("body").on('focus blur', '.color-picker', function(){
        var xid = jQuery(this).attr('id');
        var idnum = xid.replace('color', '');
        jQuery('#color_picker_color'+idnum).slideToggle();
    });

}); // end document ready



function toggle_seat_selection(x){
    var chk = jQuery('#'+x+'.selected').length;
    var chkup = jQuery('#book-seat').length;
    var pclass = jQuery('#class-'+x).val();
    if( chkup==1 ){
        if((pclass=='seat-disabled' || pclass=='no-seats' || pclass=='seat-booked') ){
            return false;
        }else if( pclass=='seat-available' ){
//          var seatname = jQuery('#'+x).attr('seatname');
			var col = $(".col-selector");
			var row = $(".row-selector");
            var seatData = getSeatName(col,row,jQuery('#'+x));
            var seatname = seatData.alias[0] + "行" + seatData.alias[1] + "号"
            var seatid = 'seat-'+jQuery('#'+x).attr('id');
            var seatRegion = $('#selectedSeatRegion');
            if( seatRegion.find('#'+seatid).length > 0 ){
                seatRegion.find('#'+seatid).remove();
                var ticketCount = seatRegion.find('span[id]').length;
            }else{
                var ticketCount = seatRegion.find('span[id]').length;
                if( ticketCount >= 4 ){
                    alert('同一订单选票不能超过4张！');
                    return false;
                }else{
                    ticketCount++;
                    seatRegion.append('<span id='+seatid+'><em>'+seatname+'</em><b>&nbsp;</b></span>');
                }
            }
            var price = $('#moviePrice').html();
            $('#selectSeatCount').html( ticketCount );
            $('#movieAmount').html( ticketCount * price );
        }
    }
    if(chk==0){
        jQuery('#'+x).addClass('selected');
        jQuery('#enabled-'+x).attr('value', '1');
    } else {
        jQuery('#'+x).removeClass('selected');
        jQuery('#enabled-'+x).attr('value', '0');
    }

}


function generate_grid(alert){
	if(alert){
		if (!confirm('是否确认生成新的座位图？如果之前的设置座位没有点击 "结束座位设置" 按钮，座位将会被重新设置')) {
			return;
		}
	}

    seatrows = jQuery.trim(jQuery('#seat-rows').val());
    seatcols = jQuery.trim(jQuery('#seat-cols').val());
    if( seatrows=='' || parseInt(seatrows,10)<=0 ){
        alert('请在横排输入框输入正确的数字！');
        return false;
    }
    if( seatcols=='' || parseInt(seatcols,10)<=0 ){
        alert('请在竖排输入框输入正确的数字！');
        return false;
    }
    var out='';
    var chkupxx = jQuery('#book-seat').length;

    if(chkupxx==1){
        var ttyy='';
    } else {
        var ttyy='seat-available';
    }
    
    for(var i=1;i<=seatrows;++i){
        out=out+'<div class="seat-row" id="row-'+i+'">';
        for(var j=1;j<=seatcols;++j){
            var gnum = i*j;
            out=out+'<div class="seat '+ttyy+'" id="'+i+'-'+j+'">\
            <input type="text" value="seat-available" id="class-'+i+'-'+j+'" name="seat['+i+']['+j+']" />\
            </div>';
        }
        out=out+'</div>';
    }

    jQuery('.seat-grid').html(out);

    for(var y=1;y<=i;++y){
        jQuery('#row-'+y).prepend('<div class="row-selector" act="'+y+'">'+y+'</div>');
    }

    var csel='<div class="seat-all-toggle">全选</div>';
    for(var z=1;z<j;++z){
        csel = csel+'<div class="col-selector" act="'+z+'">'+z+'</div>';
    }
    jQuery('.seat-grid').prepend('<div class="blank-row">'+csel+'</div>');
    save_seats()
}


function mark_seats(){
    if( jQuery('.seat.selected').length == 0 ){
        alert('请先选中要操作的座位！');
        return false;
    }
    var stype = jQuery('#seat-marker').val();
    
    jQuery('#seat-marker option').each(function(index){
        var aval = jQuery(this).val();
        jQuery('.seat.selected').removeClass(aval);
    });

    jQuery('.seat.selected').each(function(index){
        var sid = jQuery(this).attr('id');
        jQuery(this).addClass(stype);
        jQuery('#class-'+sid).attr("value", stype);
        jQuery('#enabled-'+sid).attr("value", "0");
    });
    jQuery('.row-deselector').addClass('row-selector');
    jQuery('.row-deselector').removeClass('row-deselector');
    jQuery('.seat.selected').removeClass('selected');
    
    jQuery('.seat-all-toggled').addClass('seat-all-toggle');
    jQuery('.seat-all-toggled').removeClass('seat-all-toggled');

}

//编辑座位编号
function edit_seats(){
	
	$(".edit-seats").hide();
	$(".save-seats").show();
	editFlag = true;

	//将选中的行和列恢复成未选中状态
	var deCol = $(".col-deselector");
	var deRow = $(".row-deselector");	
	for(var m=0;m<deCol.length;m++){
		deCol[m].click();
	}
	for(var m=0;m<deRow.length;m++){
		deRow[m].click();
	}
	$(".selectable").removeClass("selectable");

	
	//对行和列转换成input标签修改
	var col = $(".col-selector");
	var row = $(".row-selector");
	
	for(var i=0;i<col.length;i++){
		(function(){
			divElement = col[i];
			// 创建一个input元素 
		    var inputElement = document.createElement("input"); 
		    // 把obj里面的元素以及文本内容赋值给新建的inputElement
		    var oldValue = divElement.innerHTML;
		    inputElement.value = oldValue; 
		    inputElement.className = 'inputSeat col-inputSeat';
		    // 用新建的inputElement代替原来的oldDivElement元素 
		    document.querySelector(".blank-row").replaceChild(inputElement, divElement); 
		})(i);
	}
	
	
	for(var j=0;j<row.length;j++){
		(function(){
			divElement = row[j];
			// 创建一个input元素 
		    var inputElement = document.createElement("input"); 
		    // 把obj里面的元素以及文本内容赋值给新建的inputElement 
		    var oldValue = divElement.innerHTML;
		    inputElement.value = oldValue; 
		    inputElement.className = 'inputSeat row-inputSeat';
		    // 用新建的inputElement代替原来的oldDivElement元素 
		    document.querySelectorAll(".seat-row")[j].replaceChild(inputElement, divElement); 
		})(j);
	}
	
	//只能输入数字编号
	$(".seat-administration input").on("input propertychange",function(e){
		e.target.value = e.target.value.replace(/\D/g,'');
	});
	
}

//编号重复提示
function err_tips(flag){
	var elms = arguments;
	for(var i=1;i<elms.length;i++){
		if(flag){
			errElem.push(elms[i]);
			elms[i].style.color = "red";
			elms[i].style.fontSize = "20px";
		}else{	
			if($(errElem).index($(elms[i])) == -1){
				elms[i].style.color = "";
				elms[i].style.fontSize = "";
			}
		}
	}
}

//保存编辑编号
function save_seats(){
	errElem.length = 0;

	var col = $(".col-inputSeat");
	var row = $(".row-inputSeat");
	
	for(var i=0;i<col.length;i++){
		for(var j=i+1;j<col.length;j++){
			//编号不能重复
			if(col[i].value == col[j].value && col[i].value !=""){
				err_tips(true,col[i],col[j]);
				errFlag = true;
			}else{
				err_tips(false,col[i],col[j]);
			}
		}
	}
	
	for(var i=0;i<row.length;i++){
		for(var j=i+1;j<row.length;j++){
			//编号不能重复
			if(row[i].value == row[j].value && row[i].value !=""){
				err_tips(true,row[i],row[j]);
				errFlag = true;
			}else{
				err_tips(false,row[i],row[j]);
			}
		}
	}
	
	if(errElem.length == 0){
		errFlag = false;
	}
	
	
	//编号出错
	if(errFlag){
		$(".err-tips").show();
		return;
	}
	
	editFlag = false;
	
	$(".edit-seats").show();
	$(".save-seats").hide();
	
	$(".err-tips").hide();

	
	for(var i=0;i<col.length;i++){
		(function(){
			inputElement = col[i];
			// 创建一个input元素 
		    var divElement = document.createElement("div"); 
		    // 把obj里面的元素以及文本内容赋值给新建的inputElement 
		    divElement.innerHTML = inputElement.value; 
		    divElement.className = 'col-selector';
		    divElement.setAttribute("act",i+1)
		    // 用新建的divElement代替原来的oldinputElement元素 
		    document.querySelector(".blank-row").replaceChild(divElement, inputElement); 
		})(i);
	}
	
	for(var j=0;j<row.length;j++){
		(function(){
			inputElement = row[j];
			// 创建一个input元素 
		    var divElement = document.createElement("div"); 
		    // 把obj里面的元素以及文本内容赋值给新建的inputElement 
		    divElement.innerHTML = inputElement.value; 
		    divElement.className = 'row-selector';
		    divElement.setAttribute("act",j+1)
		    // 用新建的divElement代替原来的oldinputElement元素 
		    document.querySelectorAll(".seat-row")[j].replaceChild(divElement, inputElement); 
		})(j);
	}
	
	
}

//获取座位数据
function getSeatName(col,row,jqElm){
	var axis = jqElm.attr("id").split("-");//坐标行,列
	var alias = (row[axis[0]-1].innerHTML + "-" + col[axis[1]-1].innerHTML).split("-");//编号行,列
	return {axis:axis,alias:alias}
}

//提交座位数据
function commitData(){
	if(editFlag){
		alert("编号出错");
		return;
	}
	
	colData.length = 0;
	rowData.length = 0;
	
	$(".col-deselector").click();
	$(".row-deselector").click();
	
	var col = $(".col-selector");
	var row = $(".row-selector");
	//行列总数
	var hallName = $("#hall-input").val();
	var colNum = col.last().attr("act");
	var rowNum = row.last().attr("act");

	//已被预订座位数据
	var disable = $(".seat-disabled");
	var disableList = [];
	//过道座位数据
	var no = $(".no-seats");
	var noList = [];
	
	for(var i=0;i<disable.length;i++){
		var seatData = getSeatName(col,row,$(disable[i]))
		disableList.push(seatData.axis[0] + "-" + seatData.axis[1]);
	}
	for(var i=0;i<no.length;i++){
		var seatData = getSeatName(col,row,$(no[i]))
		noList.push(seatData.axis[0] + "-" + seatData.axis[1]);
	}
	for(var i=0;i<col.length;i++){
		colData.push(col[i].innerHTML);
	}
	for(var i=0;i<row.length;i++){
		rowData.push(row[i].innerHTML);
	}
	
	//TODO
	serverData.disableList = disableList;
	serverData.noList = noList;
	serverData.hallName = hallName;
	serverData.colNum = colNum;
	serverData.rowNum = rowNum;
	serverData.colData = colData;
	serverData.rowData = rowData;
	console.log(serverData);
	localStorage.setItem('seat',JSON.stringify(serverData)) 
	
}

//获取服务器数据显示座位
function getServerData(){
	serverData = JSON.parse(localStorage.getItem("seat"));

	if(serverData){
		console.log(serverData);
		//生成座位
		$("#hall-input").val(serverData.hallName);
		for(var i=0;i<serverData.hallList.length;i++){
			var html = '<option value="'+i+'">'+serverData.hallList[i]+'</option>';
			$("#hall-list").append(html);
		}
		$("#seat-rows").val(serverData.rowNum);
		$("#seat-cols").val(serverData.colNum);
		generate_grid()

		//设置已被预订位置
		for(var i=0;i<serverData.disableList.length;i++){
			var xyData = serverData.disableList[i].split("-");
			$("#" + xyData[0] + '-' + xyData[1]).addClass("seat-disabled").removeClass("seat-available");
			$("#book-seat #" + xyData[0] + '-' + xyData[1] + " input").val("no-seats");
		}
		
		//设置过道位置
		for(var i=0;i<serverData.noList.length;i++){
			var xyData = serverData.noList[i].split("-");
			$("#" + xyData[0] + '-' + xyData[1]).addClass("no-seats").removeClass("seat-available");
			$("#book-seat #" + xyData[0] + '-' + xyData[1] + " input").val("no-seats");
		}
		
		//设置号排序
		for(var i=0;i<serverData.colData.length;i++){
			$(".col-selector")[i].innerHTML = serverData.colData[i];
		}
		
		//设置行排序
		for(var i=0;i<serverData.rowData.length;i++){
			$(".row-selector")[i].innerHTML = serverData.rowData[i];
		}
	}else{
		serverData = {};
		addHall();
	}
	
//	$("#book-seat .seat-all-toggle").html("");
//	
//	$('.seat-administration').parent().css("height",parseInt(window.screen.height)*2/3+"px");
//	
//	$('.seat-administration').parent().on('scroll',function(){
//		if($(this).scrollTop() < 20){
//			$(".col-selector").css("top",$(this).scrollTop());
//		}else{
//			$(".col-selector").css("top",$(this).scrollTop()+20);
//		}
//		$(".row-selector").css("left",$(this).scrollLeft());
//	});

}

//新增大厅
function addHall(){
	$('.hall-modal').show();
}

//确认新增大厅
function confirmAddHall(){
	var newHall = $(".hall-modal .add-hall-name").val();
	var newCol = $(".hall-modal .add-hall-col").val();
	var newRow = $(".hall-modal .add-hall-row").val();
	if(!newHall || !newCol || !newRow){
		alert("大厅名，排，列不能为空");
		return;
	}
	console.log(newHall,newCol,newRow);
	serverData = {};
	//TODO
	serverData.hallList = ["test",1,2,3,4];
	serverData.hallName = newHall;
	serverData.colNum = newCol;
	serverData.rowNum = newRow;
	serverData.disableList = [];
	serverData.noList = [];
	serverData.colData = [];
	serverData.rowData = [];
	localStorage.setItem('seat',JSON.stringify(serverData));
	$('.hall-modal').hide();
}