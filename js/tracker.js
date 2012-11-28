/**
 * Created with JetBrains PhpStorm.
 * User: Juan
 * Date: 09-29-12
 * Time: 08:52 PM
 */
var taskDetail = '<div class="modal hide fade">' +
    '<form id="task-extra" method="post" class="form-horizontal" action="save-task.py">' +
    '<div class="modal-header">' +
    '<button class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
    ' <h3>Task Detail</h3>' +
    '</div>' +
    '<div class="modal-body">' +
    '<dl class="dl-horizontal">' +
    '<dt>Task</dt>' +
    '<dd>{{title}}</dd>' +
    '<dt>Chapter</dt>' +
    '<dd>{{chaptertitle}}</dd>' +
    '<dt>Who</dt>' +
    '<dd>{{owner}}</dd>' +
    '{{#if notes}}<dt>Notes</dt>' +
    '<dd>{{notes}}</dd>{{/if}}' +
    '{{#if duedate}}<dt>Due Date</dt>' +
    '<dd>{{date duedate}}No Due Date</dd>{{/if}}' +
    '<dt>State</dt>' +
    '<dd>{{state}}</dd>' +
    '</dl>' +
    '</div>' +
    '<div class="modal-footer form-actions">' +
    '</div>' +
    '</form>' +
    '</div>';

var editTask = '<form id="form-edit-task" method="post" class="form-horizontal" action="update-task.py">'+
    '<div class="control-group"><label class="control-label" for="task">Task</label>'+
        '<div class="controls"><input type="text" name="title" id="title" {{#if title}}value="{{title}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="who">Who</label>'+
        '<div class="controls"><input type="text" name="owner" id="owner" {{#if owner}}value="{{owner}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="chapter">Chapter</label>'+
        '<div class="controls"><input type="text" name="chaptertitle" id="chaptertitle" {{#if chaptertitle}}value="{{chaptertitle}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="notes">Notes</label>'+
        '<div class="controls"><textarea name="notes" id="notes" cols="30" rows="10">{{#if notes}}{{notes}}{{/if}}</textarea></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="duedate">Due Date</label>'+
        '<div class="controls"><input type="text" name="duedate" id="duedate" {{#if duedate}}value="{{duedate}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="duetime">Due Time</label>'+
        '<div class="controls"><input type="text" name="state" id="duetime" {{#if duetime}}value="{{duetime}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="state">State</label>'+
        '<div class="controls"><input type="text" id="state" name="state" {{#if state}}value="{{state}}"{{/if}}></div>'+
    '</div>'+
    '<div class="control-group"><label class="control-label" for="state">Completed</label>'+
        '<div class="controls"><input type="checkbox" id="completed" name="completed" '+
            '{{#if completed}}checked="checked"{{/if}} value="1"></div>'+
    '</div>'+
    '<div class="form-actions">'+
        '<button class="btn btn-danger pull-left delete" type="button">Delete</button>'+
        '<div class="pull-right">'+
        '<button class="btn btn-primary" type="submit">Done</button>'+
        '<button class="btn cancel" type="reset">Cancel</button>'+
        '</div>'+
    '</div>'+
'</form>';

var addNewTask = '<form id="add-task" action="new-task.py">'+
    '<label for="title">Task</label>' +
    '<input type="text" id="title" name="title" autofocus="autofocus" required="required">'+
    '<label for="owner">Who</label>'+
    '<input type="text" name="owner" id="owner">'+
    '<label for="chaptertitle">Chapter</label>'+
    '<input type="text" name="chaptertitle" id="chaptertitle">'+
    '<input type="submit" value="Save" class="btn btn-primary"><input type="reset" value="Cancel" class="btn">'+
'</form>';

$('#add').popover({title:'New Task', placement:'bottom',
    content: function(){
        return addNewTask;
    }
});
var Tracker = new function(){
    this.data = [];
    this.loadLocalTasks = function(){
        var data = JSON.parse(localStorage.getItem('tracker-tasks'))||[];
        /**
         * Here is why items doesn't remove on removeTask method.
         */
        for(var i = 0; i<data.length; i++){
              if (!!data[i] && !$.isEmptyObject(data[i])){
                this.data.push(data[i]);
              }
        }

    };
    this.addTask=function(task){
        this.data.push(task);
        this.saveLocal();
        //create a reference for later use
        task.index = (this.data.length-1)+"";//string so !!"0" = true, but !!0 = false
    };
    /**
     * Actually don't remove, just make it empty value
     * @param index
     */
    this.removeTask=function(index){
//        this.data.splice(index,1);
        this.data[index]=undefined;
        this.saveLocal();
    };
    this.updateTask=function(index, newObject){
        this.data[index]=newObject;
        this.saveLocal();
    };
    this.updateTaskProperty=function(index, property, value){
        this.data[index][property]=value;
        this.saveLocal();
    };
    this.saveLocal=function(){
        localStorage.setItem('tracker-tasks', JSON.stringify(Tracker.data))
    };
    this.loadLocalTasks();
    this.normalize=function(path){
        return path.toLowerCase().replace(/[\s,\.\?\']/g,'-');
    }

};
var UI = {
    windowHeight:0,
    $main: undefined,
    $mainRow:undefined,
    firstTop:undefined,
    fullWidth:0,
    bucketHeight:0,
    taskPanelsTemplate:undefined,
    taskTemplate:undefined,
    data:[],
    init:function () {
        UI.setPageTitle();
        UI.windowHeight=$(window).height();
        UI.$main =UI.settings.main.css({'max-height':parseInt(UI.windowHeight - UI.settings.main.offset().top) + 'px'});
        UI.$mainRow =UI.settings.main.children(UI.settings.rowClass);
        UI.taskPanelsTemplate=Handlebars.compile(UI.settings.taskPanelTemplate);
        UI.taskTemplate=Handlebars.compile(UI.settings.collapsedTaskTemplate);
        UI.drawBuckets(UI.load());
    },
    setPageTitle: function(){
        $('#title').text(UI.settings.pageTitle);
    },
    drawBuckets:function (data) {
        data.forEach(UI.appendTask);
        UI.recalculateBucketWidths();
        UI.bindEvents();
    },
    load:function () {
        return Tracker.data
    },
    appendTask:function (d, i) {
        if (UI.data.indexOf(d[UI.settings.propertyFilter]) == -1) {
            UI.data.push(d[UI.settings.propertyFilter]);
            UI.$mainRow.append(UI.taskPanelsTemplate(d));
        }
        if (i != undefined) {
            d.index = i + "";
        }
        $('#' + (d.state.toLowerCase() == "Active".toLowerCase() ? 'active' : 'notactive')
                + Tracker.normalize(d[UI.settings.propertyFilter])).find('.list-items').append(UI.taskTemplate(d));
    },
    recalculateBucketWidths:function () {
        UI.fullWidth = 0;
        $('div.list-items').each(function (i, item) {
            var $this = $(item);
            //firstTop == undefined:: this is to calculate the height once
            UI.bucketHeight = parseInt(UI.windowHeight - (UI.firstTop == undefined ? UI.firstTop = $this.offset().top : UI.firstTop) - 15) + 'px';
            $this.css('height', UI.bucketHeight);
            UI.fullWidth += $this.parents('.span4').outerWidth(true);
        });
        UI.$mainRow.css('width', UI.fullWidth + 'px');
    },
    bindEvents:function () {
        $(document).on('submit', '#add-task',function () {
            var $this = $(this);
            /*$.post($this.attr('action'), $this.serialize(), function(data){
             if(data.ok){*/
            var taskObject = {"title":$this.find('#title').val(),
                "owner":$this.find('#owner').val(),
                "chaptertitle":$this.find('#chaptertitle').val(),
                "state":"icebucket"};
            Tracker.addTask(taskObject);
            UI.appendTask(taskObject);
            UI.recalculateBucketWidths();

            $('#add').popover('hide');
            /*}
             }, 'json');*/
            return false;
        }).on('reset', function () {
                    $('#add').popover('hide');
                });
    },
    setSettings: function(object){
        UI.settings = object;
        return UI;
    }

};
(function ($, H) {
    H.registerHelper('date', function (path) {
        return $.datepicker.formatDate('MM ddth, yy', new Date(path));
    });
    H.registerHelper('normalize', Tracker.normalize);
    var taskDetailTemplate = H.compile(taskDetail);
    var editTaskTemplate = H.compile(editTask);
    $(document).on('click', '.taskdetail', function (e) {
        var $this = $(this);
        if($this.data('id')!=undefined){
            $(taskDetailTemplate(Tracker.data[$this.data('id')])).modal();
        }else{
            $.getJSON(/*$this.attr('href')*/'/data/taskdetail.json?'+(new Date()),function (data) {
                $(taskDetailTemplate(data)).modal();
            }).error(function () {
                    alert('Error');
                });
        }

        return false;
    }).on('click', '.edit-task', function () {
            var $this = $(this),
                $item =$this.parents('.item'),
                $form = $item.find('form');
            //detect if the is already shown
            if(!!$form.length){
                $form.remove();
            }else{

                if($this.data('id')!=undefined){
                    $item.append(
                        $(editTaskTemplate(Tracker.data[$this.data('id')])
                            )).on('click', '.cancel', function(){
                                $(this).parents('form').remove();
                                return false;
                            }).on('click', '.delete', function(){
                                if(confirm("You're goint to remove this task, are you sure?")){
                                    Tracker.removeTask($this.data('id'));
                                    $(this).parents('li').remove();
                                }
                                    return false;
                            }).on('submit', '#form-edit-task', function(){
                                $form = $(this);
                                var taskObject = {"title":$form.find('#title').val(),
                                    "owner": $form.find('#owner').val(),
                                    "chaptertitle": $form.find('#chaptertitle').val(),
                                    "notes": $form.find('#notes').val(),
                                    "duedate": $form.find('#duedate').val(),
                                    "duetime": $form.find('#duetime').val(),
                                    "state":$form.find('#state').val(),
                                    "completed":$form.find('#completed:checked').val()};
                                Tracker.updateTask($this.data('id'), taskObject);
                                $form.remove();
                                return false;
                            });
                }else{
                    $.getJSON(/*$this.attr('href')*/'/data/taskdetail.json',function (data) {
                        $item.append($(editTaskTemplate(data)));
                    }).error(function () {
                            alert('Error');
                        });
                }

            }

        });

})(window.jQuery, Handlebars);

