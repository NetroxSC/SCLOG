/*! Copyright netrox(sc) 
*   http://www.netroxsc.ru
*   sclog tree editor
*   version 1.0.2
*   2011-08-12
*	
*	License: Creative Commons Share Alike
*	http://creativecommons.org/licenses/by-sa/2.5/
*
*   Requiers jQuery, jQuery.ui.draggable, jQuery.ui.droppable
*/


function SclogEditor() {
    _brunch = {
        and: ['&', '&cap;'],
        or: ['|', '&cup;']
    },

    _leaf = {
        equal: ['=', '=', 'All'],
        notEqual: ['!=', '&ne;', 'All'],
        contains: ['~', '&sub;', 'String'],
        notContains: ['!~', '&nsub;', 'String'],
        greater: ['>', '&gt;', 'Integer'],
        less: ['<', '&lt;', 'Integer'],
        greaterOrEqual: ['>=', '&ge;', 'Integer'],
        lessOrEqual: ['<=', '&le;', 'Integer']
    },

    _variables = {
        s1: ['String', 'A', 'string variable<br/>case insensitive'],
        s2: ['String', 'B', 'string variable<br/>case insensitive'],
        i1: ['Integer', 'Y', 'integer variable'],
        i2: ['Integer', 'Z', 'integer variable']
    },
    
     _programm = "",
     _treeContainer = false,
     _brunchDrop = false,
     _leafDrop = false,
     _canDrop = false,
     _editWnd = false,
     _editWndUp = false,
     _webKitDragHack='-12px',
     
     _errorMessages=[
        'No trees, no leaves, no plants...',
        'It\'s not fall. Leaves should be on the tree.',
        'Brunches should have at least two leaves.',
        'We having forest here!',
        'Incorrect condition.'
     ];

     //Gets or sets variable
     this.Variable = function (variableName, dataType, displayAlias) {
         variableName = $.trim(variableName);
         if (!variableName.length) {
             return undefined;
         }
         dataType = $.trim(dataType);
         if (!dataType.length) {
             return _variables[variableName];
         }
         if (!displayAlias.length) {
             displayAlias = variableName;
         }
         _variables[variableName] = [dataType, displayAlias];
         return true;
     };

     //Clears variables array
     this.ClearVariables = function () {
        return delete (_variables);
     };

     //Returns variables array
     this.GetVariables = function () {
         return _variables;
     };

     //Gets or sets sclog programm string
     this.Programm = function (str) {
         if (!str) {
             return _programm;
         } else {
             _programm = $.trim(str);
         }
     };

     //Add routines for trashbox
     this.SetTrashbox = function (jQueryElement) {
         jQueryElement.droppable({
             over: function (e, ui) {
                 var d = ui.draggable;
                 $(this).addClass('sclogTrashboxOver');
                 _canDrop = true;
             },
             out: function (e, ui) {
                 $(this).removeClass('sclogTrashboxOver');
                 _canDrop = false;
             },
             drop: function (e, ui) {
                 $(this).removeClass('sclogTrashboxOver');
                 var d = ui.draggable;
                 if (d.hasClass('sclogNewElement')) {
                     d.css('top', '').css('left', '');
                 } else {
                     var p = d.parent();
                     //console.log(p);
                     if (p.hasClass('sclogCoreTree')) {
                         toggleBrunchDrop(true);
                         if (!_treeContainer.children('sclogLeaf').length) {
                             toggleLeafDrop(true);
                         }
                         p.remove();
                     } else if (p.hasClass('sclogTree')) {
                         var g = p.parent();
                         var gg = g.parent();
                         g.remove();
                         gg.children('li').last().addClass('sclogLastLeaf');
                     } else if (p[0].tagName == 'LI') {
                         var g = p.parent();
                         p.remove();
                         g.children('li').last().addClass('sclogLastLeaf');
                     } else {
                         if (!_editWndUp) {
                             d.remove();
                             toggelEditWnd();
                             toggleLeafDrop(true);
                         }
                     };
                 }

                 _canDrop = false;
             }
         });

     };

     //Defines elements from new elements menu
     this.SetNewElement = function (jQueryElement) {
         jQueryElement.addClass('sclogNewElement').draggable({
             start: function (e, ui) {
                 $(this).addClass('sclogDragging');
             },
             stop: function (e, ui) {
                 //console.log($(this).css('top'));
                 $(this).removeClass('sclogDragging');
                 $(this).css('top', '').css('left', '');
             }
         });
     };

     //Takes as agrument jQuery object which will contain a sclog-tree and prepares it for holding a tree
     this.SetTreeContainer = function (jQueryElement) {
         if (jQueryElement) {
             _treeContainer = jQueryElement;
             //prepare new drop areas
             if (_treeContainer.children('.sclogBrunchDrop').length) {
                 _brunchDrop = _treeContainer.children('.sclogBrunchDrop');
                 _brunchDrop.droppable({
                     over: function (e, ui) {
                         var d = ui.draggable;
                         if (d.hasClass('sclogBrunch') && d.hasClass('sclogNewElement')) {
                             $(this).addClass('sclogBrunchDropOver');
                             _canDrop = true;
                         } else {
                             _canDrop = false;
                         };
                     },
                     out: function (e, ui) {
                         $(this).removeClass('sclogBrunchDropOver');
                         _canDrop = false;
                     },
                     drop: function (e, ui) {
                    	 if (!_canDrop) {
                             return;
                         }
                         $(this).removeClass('sclogBrunchDropOver');
                         var d = ui.draggable;
                         d.css('top', '').css('left', '');
                         toggleLeafDrop();
                         var coreTree;
                         if (d.hasClass('sclogNewElement')) {
                             if (d.hasClass('sclogAnd')) {
                                 coreTree = newTree('&');
                             } else if (d.hasClass('sclogOr')) {
                                 coreTree = newTree('|');
                             } else {
                                 return;
                             };
                         }
                         coreTree.addClass('sclogCoreTree');
                         $(this).before(coreTree);
                         if (_treeContainer.children('div.sclogLeaf').length) {
                        	 _treeContainer.children('div.sclogLeaf').css('margin-left','');
                             var newLeaf = $('<li>').addClass('sclogLastLeaf');
                             newLeaf.append($('<div>').addClass('sclogSpacer'));
                             newLeaf.append(_treeContainer.children('div.sclogLeaf'));
                             coreTree.children('ul').append(newLeaf);
                             //Google chrome hack
                             if ($.browser.webkit) {
                                 newLeaf.children('div.sclogLeaf').css('top', _webKitDragHack);
                             }
                         }
                         _canDrop = false;
                     }
                 });
             } else {
                 _brunchDrop = false;
             };
             if (_treeContainer.children('.sclogLeafDrop').length) {
                 _leafDrop = _treeContainer.children('.sclogLeafDrop');
                 _leafDrop.droppable({
                     over: function (e, ui) {
                         var d = ui.draggable;
                         if (d.hasClass('sclogLeaf')) {
                             $(this).addClass('sclogLeafDropOver');
                             _canDrop = true;
                         } else {
                             _canDrop = false;
                         };
                     },
                     out: function (e, ui) {
                         $(this).removeClass('sclogLeafDropOver');
                         _canDrop = false;
                     },
                     drop: function (e, ui) {
                         $(this).removeClass('sclogLeafDropOver');
                         var d = ui.draggable;
                         d.css('top', '').css('left', '');
                         toggleLeafDrop();
                         var newLeaf = editLeaf('');
                         newLeaf.css('margin-left','47px');
                         _treeContainer.append(newLeaf);
                         editLeafWindow(newLeaf);
                         _canDrop = false;
                     }
                 });
             } else {
                 _leafDrop = false;
             };
             return true;
         } else {
             return false;
         };
     };

     //Prepares editor window to handle leaves
     this.SetEditWindow = function (jQueryElement) {
         if (jQueryElement) {
             _editWnd = jQueryElement;
             //инициализация селект-боксов
             var cSelect = _editWnd.find('.sclogCommandSelect');
             var cOption;
             cSelect.children().remove();
             for (var i in _leaf) {
                 cOption = $('<option>').val(i).html(_leaf[i][1]);
                 cSelect.append(cOption);
             }
             cSelect.children('option:first').attr('selected', 'selected');

             var vSelect = _editWnd.find('.sclogVariableSelect');
             var vOption;
             vSelect.children().remove();
             for (var i in _variables) {
                 vOption = $('<option>').val(i).html(_variables[i][1]);
                 vSelect.append(vOption);
             }
             vSelect.children('option:first').attr('selected', 'selected');

             vSelect.change(function () {
                 var vDataType = _variables[$(this).children('option[selected]').val()][0];
                 var cDataType = _leaf[cSelect.children('option[selected]').val()][2];
                 if (!(cDataType == 'All' || cDataType == vDataType)) {
                     cSelect.children('option[selected]').removeAttr('selected');
                 }
                 var cOptions = cSelect.children('option');
                 for (var i = 0; i < cOptions.length; i++) {
                     cDataType = _leaf[$(cOptions[i]).val()][2];
                     if (cDataType == 'All' || cDataType == vDataType) {
                         $(cOptions[i]).removeAttr('disabled');
                     } else {
                         $(cOptions[i]).attr('disabled', 'disabled');
                     };
                 };
                 _editWnd.find('.sclogHelpStr').html(_variables[$(this).children('option[selected]').val()][2]);
             }).change();
         }
     };

     this.ClearTree = function () {
         _treeContainer.children('.sclogTree').remove();
         _treeContainer.children('.sclogLeaf').remove();
     };

     //Draws a tree in tree-container defined by SetTreeContainer
     this.Tree = function () {
    	 if (_treeContainer) {
             if (_programm.length) {
                 var t = makeTree(_programm);
                 if (t) {
                     toggleLeafDrop();
                     if (t.hasClass('sclogTree')) {
                         t.addClass('sclogCoreTree');
                     }
                     if (_brunchDrop && t.hasClass('sclogTree')) {
                         _treeContainer.prepend(t);
                     } else {
                    	 if (t.hasClass('sclogLeaf')){
                    		 t.css('margin-left','47px');
                    	 };
                         _treeContainer.append(t);
                     }
                     return true;
                 }
             } else {
                 toggleBrunchDrop(true);
                 toggleLeafDrop(true);
             }
         }
     };

     //Generates new program code on success
     this.Parse = function (tree) {
         if (!tree) {
             tree = _treeContainer;
         }
         var tcount = tree.children('.sclogTree').length;
         if (tcount > 1) {
             throw _errorMessages[3];
             return false;
         }
         if (tcount) {
             var result = '';
             if (tree.children('.sclogTree').children('.sclogOr').length > 0) {
                 result += '|(';
             } else {
                 result += '&(';
             };
             var brunch = tree.children('.sclogTree').children('ul').children('li');
             if (brunch.length < 2) {
            	 throw _errorMessages[2];
                 return false;
             } else {
                 for (var i = 0; i < brunch.length; i++) {
                     var r = this.Parse($(brunch[i]));
                     if (!r) {
                    	 throw _errorMessages[4];
                         return false;
                     };
                     result += r + ',';
                 };
                 result = result.substring(0, result.length - 1) + ')';
                 return result;
             };
         } else {
             if (tree.find('.sclogLeaf input:hidden').length>0){
            	 if (parseLeaf(tree.find('.sclogLeaf input:hidden').val())){
            		 return tree.find('.sclogLeaf input:hidden').val();
            	 } else {
            		 throw _errorMessages[4];
            	 }
             } else {
            	 throw _errorMessages[0];
             }
         };
     };

     function toggleBrunchDrop(show) {
         if (_brunchDrop) {
             if (show) {
                 _brunchDrop.show();
             } else {
                 _brunchDrop.hide();
             }
         };
     }

     function toggleLeafDrop(show) {
         if (_leafDrop) {
             if (show) {
                 _leafDrop.show();
             } else {
                 _leafDrop.hide();
             }
         };
     }

     function toggelEditWnd(show) {
         if (_editWnd) {
             if (show) {
                 _editWnd.show();
                 _editWnd.css('top',Math.floor((window.screen.height - 100) / 3)+'px').css('left',Math.floor((window.screen.width - 560) / 2) + 'px');
             } else {
                 _editWnd.hide();
             };
         }
     }

     function newTree(cmd) {
         var tree = $('<div>').addClass('sclogTree');
         tree.append(newBrunch(cmd)).append('<ul>');
         return tree;
     }

     function newBrunch(cmd) {
         var brunch = $('<div>').addClass('sclogBrunch').attr('id',createID());
         if (cmd == '&' || cmd=='and') {
             brunch.addClass('sclogAnd').html(_brunch.and[1]);
         } else if (cmd=='|' || cmd=='or'){
             brunch.addClass('sclogOr').html(_brunch.or[1]);
         } else {
        	 return false;
         };

         brunch.droppable({
             over: function (e, ui) {
                 var d = ui.draggable;
                 if ((d.parent()).find('#' + $(this).attr('id')).length == 0) {
                     $(this).addClass('sclogDragOver');
                     _canDrop = true;
                 }
             },
             out: function (e, ui) {
                 $(this).removeClass('sclogDragOver');
                 _canDrop = false;
             },
             drop: function (e, ui) {
                 $(this).removeClass('sclogDragOver');
                 if (!_canDrop) {
                     return;
                 };
                 var d = ui.draggable;
                 var t = $(this).parent();
                 var p = d.parent();
                 t.children('ul').children('li').removeClass('sclogLastLeaf');
                 var newLeaf = $('<li>').addClass('sclogLastLeaf');
                 //newLeaf.append($('<img src="Styles/bullet.png">').addClass('sclogSpacer'));
                 newLeaf.append($('<div>').addClass('sclogSpacer'));
                 t.children('ul').append(newLeaf);
                 if (d.hasClass('sclogNewElement')) {
                     if (d.hasClass('sclogBrunch')) {
                         if (d.hasClass('sclogAnd')) {
                             newLeaf.append(newTree('&'));
                         } else if (d.hasClass('sclogOr')) {
                             newLeaf.append(newTree('|'));
                         }
                     } else if (d.hasClass('sclogLeaf')) {
                         var nl = editLeaf('');
                         newLeaf.append(nl);
                         editLeafWindow(nl);
                     };
                 } else if (p.hasClass('sclogTree')) {
                     if (p.hasClass('sclogCoreTree')) {
                         p.removeClass('sclogCoreTree');
                         newLeaf.append(p);
                     } else {
                         var g = p.parent();
                         newLeaf.append(p);
                         var gg = g.parent();
                         //console.log(gg);
                         g.remove();
                         gg.children('li').last().addClass('sclogLastLeaf');
                     }
                 } else if (d.hasClass('sclogLeaf')) {
                     // console.log('aaa');
                     // console.log($.browser);
                     newLeaf.append(d);
                     var g = p.parent();
                     p.remove();
                     g.children('li').last().addClass('sclogLastLeaf');
                 }
                 _canDrop = false;
             }
         }).draggable({
             start: function (e, ui) {
                 $(this).addClass('sclogDragging');
             },
             stop: function (e, ui) {
                 $(this).removeClass('sclogDragging');
                 if (!_canDrop) {
                     $(this).css('top', '').css('left', '');
                     //Google Chrome hack
                     if ($.browser.webkit) {
                         ($(this).parent()).find('div.sclogLeaf').css('top', _webKitDragHack);
                     }
                 }
             }
         });
         return brunch;
     }

     //generates contents of leaf from string "programm", if jQueryElement is undefined returns new jQuery object
     function editLeaf(programm, jQueryElement) {
         //console.log("AAA");
         
         if (!jQueryElement) {
             var leaf = $('<div>').addClass('sclogLeaf');
             leaf.append($('<input type="hidden">')).append($('<div>').append($('<span class="sclogSpanVar">')).append($('<span class="sclogSpanCmd">')).append($('<span class="sclogSpanVal">')));
             leaf.draggable({
                 start: function (e, ui) {
                     $(this).addClass('sclogDragging');
                     //console.log($($(this).parent()).height());
                 },
                 stop: function (e, ui) {
                     $(this).removeClass('sclogDragging');
                     if (!_canDrop) {
                         $(this).css('top', '').css('left', '');
                         //console.log($($(this).parent()).height());
                         //google chrome hack
                         if ($.browser.webkit) {
                             $(this).css('top', _webKitDragHack);
                         }
                     }
                 }
             }).dblclick(function () {
                 //console.log($(this));
                 editLeafWindow($(this));
             });
             leaf.addClass('sclogLeafError');
         } else {
             var leaf = jQueryElement;
            // console.log(jQueryElement.parent());
         };

         var l=parseLeaf(programm);
         if (l) {
             leaf.removeClass('sclogLeafError');
             leaf.find('span.sclogSpanVar').html(_variables[l.variable][1]);
             leaf.find('span.sclogSpanCmd').html(_leaf[l.command][1]);
             leaf.find('span.sclogSpanVal').text(l.value);
             leaf.find('input:hidden').val(_leaf[l.command][0] + '(' + l.variable + ',' + l.value + ')');
         } else {
             leaf.addClass('sclogLeafError');
         };
         return leaf;
     }

     //shows editor window for corresponding leaf
     function editLeafWindow(jQueryElement) {
         if (_editWndUp) {
             return;
         }
         _editWndUp = true;
         if (jQueryElement) {
            var leaf=parseLeaf(jQueryElement.find('input:hidden').val());
            if (leaf) {
                //console.log(leaf);
                _editWnd.find('.sclogVariableSelect option[selected]').removeAttr('selected');
                _editWnd.find('.sclogCommandSelect option[selected]').removeAttr('selected');
                _editWnd.find('select.sclogVariableSelect option[value="' + leaf.variable + '"]').attr('selected', 'selected');
                _editWnd.find('select.sclogCommandSelect option[value="' + leaf.command + '"]').attr('selected', 'selected');
                _editWnd.find('select.sclogVariableSelect').change();
                if (_variables[leaf.variable][0] == 'String') {
                    if (leaf.value.length > 2) {
                        leaf.value = leaf.value.substring(1, leaf.value.length - 1);
                    } else {
                        leaf.value = "";
                    };
                }
                _editWnd.find('.sclogLeafValue').val(leaf.value);
            } else {
                _editWnd.find('.sclogLeafValue').val('');
            }
            _editWnd.find('.sclogSaveLeaf').click(function () {
                var value = $.trim(_editWnd.find('.sclogLeafValue').val());
                if (value.length == 0) {
                    return;
                }
                var datatype = _variables[_editWnd.find('.sclogVariableSelect').val()][0];
                if (datatype == 'Integer') {
                    console.log(datatype);
                    console.log(parseInt(value));
                    if (isNaN(parseInt(value))) {
                        return;
                    }
                }
                var variable = _editWnd.find('select.sclogVariableSelect').val();
                var command = _leaf[_editWnd.find('select.sclogCommandSelect').val()][0];
                if (datatype == 'String') {
                    value = '"' + value + '"';
                };
                // console.log(command + '(' + variable + ',' + value + ')');
                editLeaf(command + '(' + variable + ',' + value + ')', jQueryElement);
                toggelEditWnd();
                $(this).unbind('click');
                _editWndUp = false;
            });
            _editWnd.find('.sclogCancelLeaf').click(function () {
                toggelEditWnd();
                $(this).unbind('click');
                _editWndUp = false;
            });
            _editWnd.find('.sclogHelpStr').html(_variables[_editWnd.find('.sclogVariableSelect option[selected]').val()][2]);
            toggelEditWnd(true);
         }
     }

     //parses leaf from string and returns object with properties: command, variable, value
     function parseLeaf(str) {
         str = $.trim(str);
         if (str.length < 6) {
             return false;
         };
         var leaf = Object();
         ind = str.indexOf('(');
         if (ind > 0) {
             leaf.command = getCommandName(str.substr(0, ind));
             if (!leaf.command) { return false; };
             str = str.substr(ind + 1);
         } else {
             return false;
         };

         ind = str.indexOf(',');
         if (ind > 0) {
             leaf.variable = $.trim(str.substr(0, ind));
             if (leaf.variable.length == 0) { return false; };
             if (_variables[leaf.variable] == undefined) {
                 return false;
             };
             str = str.substr(ind + 1);
         } else {
             return false;
         };

         ind = str.indexOf(')');
         if (ind > 0 && (str.length == (ind + 1))) {
             leaf.value = $.trim(str.substr(0, ind));
             if (_variables[leaf.variable][0] == 'String') {
                 if (!(leaf.value[0] == '"' && leaf.value[leaf.value.length - 1] == '"')) {
                     return false;
                 } else {
                     //leaf.value = leaf.value.substr(1, leaf.value.length - 2);
                 }
             };
             if (leaf.value.length == 0) { return false; };
         } else {
             return false;
         };

         return leaf;
     }

     //gets name of list command
     function getCommandName(str) {
         str = $.trim(str);
         for (var i in _brunch) {
             if (_brunch[i][0] == str) {
                 return i;
             };
         }
         for (var i in _leaf) {
             if (_leaf[i][0] == str) {
                 return i;
             };
         };
         return false;
     }


     function createID() {
         return 'sclog_' + Math.floor(Math.random() * 1000000) + '_' + Math.floor(Math.random() * 1000000);
     }
     
     function makeTree(str) {
         var b = str.indexOf('(');
         if (b < 1) {
             return false;
         }
         var result;
         var cmd = getCommandName(str.substr(0, b));
         if (cmd) {
             if (cmd == 'and' || cmd == 'or') {
                 var e = getBrunchEnd(str);
                 if (e) {
                     result = newTree(cmd);
                     str = str.substr(b + 1, e-b-1);
                     var flag = true;
                     while (flag) {
                         e = getBrunchEnd(str);
                         if (e) {
                             //console.log(str.substr(0, e+1));
                             var leaf = makeTree(str.substr(0, e+1));
                             if (leaf) {
                                 result.children('ul').append($('<li>').append($('<div>').addClass('sclogSpacer')).append(leaf));
                             } else {
                                 return false;
                             }
                             if ((e + 1) < str.length) {
                                 str = $.trim(str.substr(e + 1));
                                 if (str[0] == ',') {
                                     str = str.substr(1);
                                 }
                             } else {
                                 flag = false;
                             }
                         } else {
                             return false;
                         }
                     }
                     result.children('ul').children('li:last').addClass('sclogLastLeaf');
                     //Chrome hack 
                     if ($.browser.webkit) {
                         result.find('div.sclogLeaf').css('top', _webKitDragHack);
                     }
                     return result;
                 } else {
                     return false;
                 }
             } else {
                 return editLeaf(str);
             }
         };
     }
     
     function getBrunchEnd(str) {
         if (str.length < 6) {
             return false;
         };
         brackets = 1;
         for (i = str.indexOf('(') + 1; i < str.length; i++) {
             if (str[i] == '(') {
                 brackets++;
             } else if (str[i] == ')') {
                 brackets--;
                 if (brackets == 0) {
                     return i;
                 };
             };
         };
         return false;
     }
}