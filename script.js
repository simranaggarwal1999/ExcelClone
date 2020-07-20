const $ = require("jquery");
const fs = require("fs");
// to open dialog box
const dialog = require("electron").remote.dialog;
// load when html is loaded
$(document).ready(
    function () {
        let db;
        let lsc; //last selected cell

        // ````````````````Formatting Functionality`````````````````
        // Open either File or Home menu options
        $(".menu>*").on("click", function () {
            let itemId = $(this).attr("id");
            $(".menu-options-item").removeClass("active");
            $(`#${itemId}-menu-options`).addClass("active");
        })

        $("#grid .cell").on("click", function () {
            // let cCell=this
            let ri = Number($(this).attr("ri"));
            let ci = Number($(this).attr("ci"));
            let address = String.fromCharCode(ci + 65) + (ri + 1);
            let cellObject = getCellObject(ri, ci);
            // console.log(address);
            $("#address-input").val(address);
            if (cellObject.formula !== "") {
                $("#formula-input").val(cellObject.formula);
            }
            else {
                if (cellObject.value == "") {
                    $("#formula-input").val("");
                }
                else {
                    $("#formula-input").val(cellObject.value);
                }
            }

            $(this).addClass("selected");
            if (lsc && lsc != this) {
                $(lsc).removeClass("selected");
                lsc = this;
            }
            else {
                lsc = this;
            }

            if (cellObject.bold) {
                $("#bold").addClass("selected");
            }
            else {
                $("#bold").removeClass("selected");
            }
            if (cellObject.underline) {
                $("#underline").addClass("selected");
            }
            else {
                $("#underline").removeClass("selected");
            }
            if (cellObject.italic) {
                $("#italic").addClass("selected");
            }
            else {
                $("#italic").removeClass("selected");
            }
            $("#bg-color").val(cellObject.bgColor);
            $("#text-color").val(cellObject.textColor);
            $("#font-size").val(cellObject.fontSize);
            $("#font-family").val(cellObject.fontFamily);
            $('[halign]').removeClass('selected');
            $('[halign=' + cellObject.halign + ']').addClass('selected');
        })

        $("#font-family").on("change", function () {
            let fontFamily = $(this).val();
            // let cell = $("#grid .cell .selected")
            $(lsc).css("font-family", fontFamily);

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].fontFamily = fontFamily;
        })

        $('#font-size').on("change", function () {
            let fontSize = $(this).val();
            $(lsc).css("font-size", fontSize + 'px');

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].fontSize = fontSize;

        })

        $('#bold').on("click", function () {
            $(this).toggleClass('selected');
            let bold = $(this).hasClass('selected');

            $(lsc).css("font-weight", bold ? "bolder" : "normal");

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].bold = bold;
        })

        $('#underline').on("click", function () {
            $(this).toggleClass('selected');
            let underline = $(this).hasClass('selected');

            $(lsc).css("text-decoration", underline ? "underline" : "none");

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].underline = underline;

        })

        $('#italic').on("click", function () {
            $(this).toggleClass('selected');
            let italic = $(this).hasClass('selected');

            $(lsc).css("font-style", italic ? "italic" : "normal");

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].italic = italic;
        })

        $('#bg-color').on("change", function () {
            let bgColor = $(this).val();
            $(lsc).css("background-color", bgColor);
            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));
            db[rid][cid].bgColor = bgColor;
        })

        $('#text-color').on("change", function () {
            let textColor = $(this).val();
            $(lsc).css("color", textColor);

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].textColor = textColor;
        })

        $('[halign]').on('click', function () {
            $('[halign]').removeClass('selected');
            $(this).addClass('selected');

            let halign = $(this).attr('halign');
            $(lsc).css("text-align", halign);

            let rid = parseInt($(lsc).attr('ri'));
            let cid = parseInt($(lsc).attr('ci'));

            db[rid][cid].halign = halign;
        })



        // ````````````````New Open Save`````````````````
        // New click=> Ui and DB 
        $("#New").on("click", function () {
            db = [];
            let rows = $("#grid").find(".row");
            for (let i = 0; i < rows.length; i++) {
                let row = [];
                let cells = $(rows[i]).find(".cell");
                for (let j = 0; j < cells.length; j++) {
                    let cell = {
                        value: "",
                        formula: "",
                        downstream: [],
                        upstream: [],
                        fontFamily: "Arial",
                        fontSize: 16,
                        bold: false,
                        underline: false,
                        italic: false,
                        bgColor: "#FFFFFF",
                        textColor: "#000000",
                        halign: "left"
                        // circularRef:false
                    }

                    $(cells[j]).html(cell.value);
                    // jquery API
                    $(cells[j]).css('font-family', cell.fontFamily);
                    $(cells[j]).css("font-size", cell.fontSize + 'px');
                    $(cells[j]).css("font-weight", cell.bold ? "bolder" : "normal");
                    $(cells[j]).css("text-decoration", cell.underline ? "underline" : "none");
                    $(cells[j]).css("font-style", cell.italic ? "italic" : "normal");
                    $(cells[j]).css("background-color", cell.bgColor);
                    $(cells[j]).css("color", cell.textColor);
                    $(cells[j]).css("text-align", cell.halign);
                    row.push(cell);
                }
                db.push(row);
            }
            console.log(db);
            // click the first cell always a new file is created
            $($("#grid .cell")[0]).trigger("click");
        })
        // Save click
        $("#Save").on("click", async function () {
            // first time save / file name =? create => data save 
            let sdb = await dialog.showOpenDialog();
            let jsonData = JSON.stringify(db);
            // get an array of file paths selected
            fs.writeFileSync(sdb.filePaths[0], jsonData);
            console.log("File Saved")
        })
        // Open click
        $("#Open").on("click", async function () {
            let sdb = await dialog.showOpenDialog();
            let bufferContent = fs.readFileSync(sdb.filePaths[0]);
            db = JSON.parse(bufferContent);
            let rows = $("#grid").find(".row");
            for (let i = 0; i < rows.length; i++) {
                let cells = $(rows[i]).find(".cell");
                for (let j = 0; j < cells.length; j++) {
                    let cell = db[i][j];
                    $(cells[j]).html(cell.value);
                    $(cells[j]).css('font-family', cell.fontFamily);
                    $(cells[j]).css("font-size", cell.fontSize + 'px');
                    $(cells[j]).css("font-weight", cell.bold ? "bolder" : "normal");
                    $(cells[j]).css("text-decoration", cell.underline ? "underline" : "none");
                    $(cells[j]).css("font-style", cell.italic ? "italic" : "normal");
                    $(cells[j]).css("background-color", cell.bgColor);
                    $(cells[j]).css("color", cell.textColor);
                    $(cells[j]).css("text-align", cell.halign);
                }
            }
            console.log("File opened");
        })

        // ````````````````Formula`````````````````

        // => when you enter anything who shoul put an entry inside db 
        $("#grid .cell").on("blur", function () {
            let ri = Number($(this).attr("ri"));
            let ci = Number($(this).attr("ci"));
            // db[ri][ci] = $(this).html();
            let cellObject = getCellObject(ri, ci);
            // If new value is equal to initial value then return
            if ($(this).html() == cellObject.value) {
                return;
            }
            // Updating value of an existing formula cell then remove formula that is 
            // remove yourself in downstream of upstream parents
            if (cellObject.formula) {
                removeFormula(cellObject, ri, ci);
            }
            // Update
            updateCell(ri, ci, $(this).html());
        })

        $("#formula-input").on("blur", async function () {
            let cellAddress = $("#address-input").val();
            let { colId, rowId } = getRCFromAdress(cellAddress);
            let cellObject = getCellObject(rowId, colId);
            let formula = $(this).val();
            // If same formula
            if (cellObject.formula == formula)
                return;
            let isValid = await isFormulaValid(formula, cellObject, rowId, colId);
            // If cycle forming
            if (!isValid)
                return;
            // Formula already present
            if (cellObject.formula)
                await removeFormula(cellObject, rowId, colId);
            // set Formula property
            cellObject.formula = formula;
            // evaluate formula
            let rVal = await evaluate(cellObject);
            // set yourself in the downstream array of parent so that updation is chained
            await setupFormula(rowId, colId, cellObject.formula);
            // Update
            await updateCell(rowId, colId, rVal);
        })

        // ````````````````````Cycle check `````````````````````````
        async function isFormulaValid(formula, cellObject, rowId, colId) {
            // Setup formula
            // Cycle check
            // If true => Remove formula , return false, console.log("circular references")
            // else return true

            let count = await setupFormulaFake(cellObject, formula);
            let isCyclic = await checkCycle(cellObject, rowId, colId);
            await removeFormulaFake(cellObject, count);
            if (isCyclic) {
                updateCell(rowId, colId, "0")
                console.log("circular references");
                alert("circular references");
                return false;
            }
            else {
                console.log("Formula is valid");
                return true;
            }
        }

        function checkCycle(cellObject, rowId, colId) {
            let visited = [];
            let queue = [];

            queue.push({
                cellObject: cellObject,
                rowId: rowId,
                colId: colId
            })
            while (queue.length > 0) {
                let remObj = queue.shift();

                if (visited.find(element => (element.rowId == remObj.rowId && element.colId == remObj.colId)) !== undefined) {
                    return true;
                }
                visited.push(remObj);
                for (let i = 0; i < remObj.cellObject.upstream.length; i++) {
                    let nbr = remObj.cellObject.upstream[i];
                    let nbrObj = getCellObject(nbr.rowId, nbr.colId);
                    queue.push({
                        cellObject: nbrObj,
                        rowId: nbr.rowId,
                        colId: nbr.colId
                    })
                }
            }
            return false;
        }

        function setupFormulaFake(cellObject, formula) {
            let formulaArr = formula.split(" ");
            let count = 0;
            // ["(","A1","+","A2",")"]
            for (let i = 0; i < formulaArr.length; i++) {
                let code = formulaArr[i].charCodeAt(0);
                if (code >= 65 && code <= 90) {
                    // get parent values
                    let parent = getRCFromAdress(formulaArr[i]);
                    if (cellObject.upstream.find(element => (element.rowId == parent.rowId && element.colId == parent.colId)) === undefined) {
                        count++;
                        cellObject.upstream.push({
                            rowId: parent.rowId,
                            colId: parent.colId
                        })
                    }

                }
            }
            return count;
        }

        function removeFormulaFake(cellObject, count) {
            for (let i = 0; i < count; i++) {
                cellObject.upstream.pop();
            }
        }
        //```````````````````````````````````````````````````````````````` 

        async function evaluate(cellObject) {
            // ( A1 + A2 )
            let formula = cellObject.formula;
            // console.log(formula);
            let formulaArr = formula.split(" ");
            // ["(","A1","+","A2",")"]
            for (let i = 0; i < formulaArr.length; i++) {
                let code = formulaArr[i].charCodeAt(0);
                if (code >= 65 && code <= 90) {
                    // get parent values
                    let parent = getRCFromAdress(formulaArr[i]);
                    let parentObj = db[parent.rowId][parent.colId];
                    let value = parentObj.value;
                    formula = formula.replace(formulaArr[i], value);
                }
            }
            // ( 10 + 20 )
            // console.log(formula);
            // infix evaluation
            // let rVal=eval(formula);
            let rVal = await infixEvaluate(formula);
            // console.log(rVal);
            return rVal;
        }

        function getPrecedence(op) {
            let res = 0;
            switch (op) {
                case "+": res = 2; break;
                case "-": res = 1; break;
                case "*": res = 3; break;
                case "/": res = 4; break;
                case "^": res = 5; break;
            }
            return res;
        }
        function getRes(val1, val2, op) {
            let num1 = Number(val1);
            let num2 = Number(val2);
            let res = 0;
            switch (op) {
                case "+": res = num1 + num2; break;
                case "-": res = num1 - num2; break;
                case "*": res = num1 * num2; break;
                case "/": res = num1 / num2; break;
                case "^": res = Math.pow(num1, num2); break;
            }
            return res;
        }

        async function infixEvaluate(formula) {
            let formulaArr = formula.split(" ");
            let operandSt = [];
            let operatorSt = [];

            for (let i = 0; i < formulaArr.length; i++) {
                let str = formulaArr[i];
                // console.log(str);
                let ch = str.charCodeAt(0);
                // console.log(ch-'0');
                if (((ch - 48) >= 0) && ((ch - 48) <= 9)) {
                    operandSt.push(str);
                }
                else if (str === "(") {
                    operatorSt.push(str);
                }
                else if (str === ")") {
                    while (operatorSt[operatorSt.length - 1] !== "(") {
                        let op = operatorSt.pop();
                        let val2 = operandSt.pop();
                        let val1 = operandSt.pop();

                        let res = await getRes(val1, val2, op);
                        operandSt.push(res.toString());
                    }
                    operatorSt.pop();
                }
                else {
                    while (operatorSt.length > 0 && operatorSt[operatorSt.length - 1] !== "(" && await getPrecedence(operatorSt[operatorSt.length - 1]) >= await getPrecedence(str)) {
                        let op = operatorSt.pop();
                        let val2 = operandSt.pop();
                        let val1 = operandSt.pop();

                        let res = await getRes(val1, val2, op);
                        operandSt.push(res.toString());
                    }
                    operatorSt.push(str);

                }
            }
            return operandSt.pop();

        }

        async function updateCell(rowId, colId, rVal) {

            let cellObject = getCellObject(rowId, colId);
            cellObject.value = rVal;
            // update yourself
            $(`#grid .cell[ri=${rowId}][ci=${colId}]`).html(rVal);

            // update your child in the downstreaam array
            for (let i = 0; i < cellObject.downstream.length; i++) {
                let child = cellObject.downstream[i];
                let childObj = getCellObject(child.rowId, child.colId);
                let rVal = await evaluate(childObj);
                await updateCell(child.rowId, child.colId, rVal);
            }
        }
        // set yourself in the downstream array of parent so that updation is chained
        function setupFormula(rowId, colId, formula) {
            // ( A1 + A2 )
            let cellObject = getCellObject(rowId, colId);
            let formulaArr = formula.split(" ");
            // ["(","A1","+","A2",")"]
            for (let i = 0; i < formulaArr.length; i++) {
                let code = formulaArr[i].charCodeAt(0);
                if (code >= 65 && code <= 90) {
                    // get parent values
                    let parent = getRCFromAdress(formulaArr[i]);
                    let parentObj = db[parent.rowId][parent.colId];

                    parentObj.downstream.push({
                        rowId: rowId,
                        colId: colId
                    })
                    cellObject.upstream.push({
                        rowId: parent.rowId,
                        colId: parent.colId
                    })
                }
            }
        }

        // remove yourself in downstream of upstream parents
        function removeFormula(cellObject, rowId, colId) {
            for (let i = 0; i < cellObject.upstream.length; i++) {
                let parent = cellObject.upstream[i];
                let parentObj = getCellObject(parent.rowId, parent.colId);
                let updatedDownstream = parentObj.downstream.filter(function (child) {
                    return (!(child.rowId == rowId && child.colId == colId));
                })
                parentObj.downstream = updatedDownstream;
            }
            // remove formula
            cellObject.formula = "";
            // clear upstream
            cellObject.upstream = [];
        }

        function getCellObject(rowId, colId) {
            // console.log(db[rowId][colId]);
            return db[rowId][colId];
        }
        function getRCFromAdress(cellAddress) {
            let colId = cellAddress.charCodeAt(0) - 65;
            let row = cellAddress.substring(1);
            let rowId = Number(row) - 1;
            return { colId, rowId };
        }

        // First thing to initialise db
        function init() {
            console.log("init called")
            $("#File").trigger("click");
            $("#New").trigger("click");
        }
        init()
    })
