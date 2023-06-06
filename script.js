    window.onload = async function(){

    // Выводим время запуска в консоль
        console.log("[" + new Date().toLocaleString() + "] Запуск...");

    // Привязываем запуск функции к кнопке
        document.getElementById("button").addEventListener("click", main);

    // Разрешаем использование табуляции в textarea
        [...document.getElementsByClassName('tabs')].forEach(function(elem) {
            elem.addEventListener('keydown', function(e) {
                if (e.key == 'Tab') {
                    e.preventDefault();
                    var start = this.selectionStart;
                    var end = this.selectionEnd;
                    // set textarea value to: text before caret + tab + text after caret
                    this.value = this.value.substring(0, start) +
                    "\t" + this.value.substring(end);
                    // put caret at right position again
                    this.selectionStart =
                    this.selectionEnd = start + 1;
                }
            });
        });

    // Запоминаем имеющиеся в body элементы чтобы потом их не удалить
        const statics = [...document.body.getElementsByTagName("*")];

        main();

        return;

        async function main() {

        console.log("[" + new Date().toLocaleString() + "] Запуск функции main...");

    // Удаление прошлых результатов
        [...document.body.getElementsByTagName("*")].forEach(function(elem) {
            if (! statics.includes(elem))
            elem.remove();
        });

    // Чтение данных из полей ввода
    // Массив с именами вариантов
        const names =
        document.getElementById("v")
        .value.split(/\r?\n/)
        .filter(string => string.trim().length != 0)
        .map(string => string.replace(/\s+/g, " ").trim());
    // Число вариантов
        const VARIANT = names.length;

    // Массив с предпочтениями
        const pref_names_powers =
        document.getElementById("p")
        .value.split(/\r?\n/)
        .filter(string => string.trim().length != 0)
        .map(string => string.replace(/\s+/g, " ").trim());
    // Число предпочтений
        const PREF = pref_names_powers.length;

    // Массив с названиями предпочтений
        var pref_names = [];
    // Массив с весовыми коэффициентами
        var pref_powers = [];
    // Массив с типами преобладания
        var prep_bm = [];
        for (let string of pref_names_powers) {
            let arr = string.split(" ");
            let power = parseFloat(arr.pop().replaceAll(",", "."));
            if (isNaN(power)) {
                appendPara().innerHTML = "<b style='color:red;'>Неправильный весовой коэффициент: " + string + "</b>";
                return false;
            }
            pref_names.push(arr.join(" "));
            if (power >= 0) {
                pref_powers.push(power);
                // true если большее значение преобладает над меньшим.
                prep_bm.push(true);
            } else {
                pref_powers.push(Math.abs(power));
                // false если меньшее значение преобладает над большим.
                prep_bm.push(false);
            }
        }
        console.log(pref_names);
        console.log(pref_powers);
        console.log(prep_bm);

    // Проверяем, что сумма весовых коэффициентов равна единице
        if (tfix(pref_powers.reduce((a, b) => {return a + b; })) != 1) {
            appendPara().innerHTML = "<b style='color:red;'>Сумма весовых коэффициентов не равна единице!</b>";
            return false;
        }
    // Массив строк матрицы бинарных предпочтений
        const preps =
        document.getElementById("b")
        .value.split(/\r?\n/)
        .filter(string => string.trim().length != 0)
        .map(string => string.replace(/\s+/g, " ").trim());
        console.log(preps);
        if (preps.length != PREF){
            appendPara().innerHTML = "<b style='color:red;'>Количество строк в матрице бинарных предпочтений не соответствует числу предпочтений!</b>";
            return false;
        }

    // 2D массив матрицы бинарных предпочтений
        var prep = [];
        for (let string of preps) {
            let arr = string.replaceAll(",", ".").split(" ");
            arr.map(elem => parseFloat(elem));
            if (arr.length != VARIANT) {
                appendPara().innerHTML = "<b style='color:red;'>Количество коэффициентов в строке матрицы бинарных предпочтений не соответствует числу вариантов: " + string + "</b>";
                return false;
            }
            if (arr.some(elem => isNaN(elem))) {
                appendPara().innerHTML = "<b style='color:red;'>Неправильный коэффициент в строке матрицы бинарных предпочтений: " + string + "</b>";
                return false;
            }
            prep.push(arr);
    }
        console.log(prep);

    {
        //Блок рассчётов
        //Массивы, заполненные нулями
        const ratingDom = new Array(VARIANT).fill(0);
        const ratingBlock = new Array(VARIANT).fill(0);
        const ratingTurnir = new Array(VARIANT).fill(0);
        const kmax = new Array(VARIANT).fill(0);
        const kopt = new Array(VARIANT).fill(0);

        for (let k = 0; k < prep.length; k++) {
            appendPara("", "hr");  // Горизонтальная линия-разделитель
            appendPara("" + pref_names[k] + ":", "h3");

            //2D массив VARIANT x VARIANT, заполненный нулями
            let Dom_data = new Array(VARIANT).fill().map(() =>
            new Array(VARIANT).fill(0));
            build_matrix(prep[k], prep_bm[k], Dom_data);
            appendTable(Dom_data, [], names);

            //обработка данных
            let dom_Array = [];  //int
            let block_Array = [];  //int
            let turnir_Array = [];  //double
            let kopt_Array = new Array(VARIANT).fill(-1);  //int
            let Karray = createKarray(Dom_data, VARIANT, VARIANT);
            createKopt(Karray, VARIANT, kopt_Array);

            appendPara("K-opt:", "h4");
            appendTable(kopt_Array, [], names);

            appendPara("K-max механизм:", "h4");
            appendTable(makeArrKopt(Karray, VARIANT, 4, kopt_Array), [], names);

            //определение доминирующих вариантов
            dom_Array = blockDomMechanism(Dom_data, VARIANT, VARIANT, false);
            //определение блокирующих вариантов
            block_Array = blockDomMechanism(Dom_data, VARIANT, VARIANT, true);
            //определение турнирных вариантов
            turnir_Array = turnir(Dom_data, pref_powers, VARIANT, VARIANT, k);
                {
                    let tmp_table = [];
                    for (let i = 0; i < dom_Array.length; ++i)
                    {
                        tmp_table.push(names[dom_Array[i]]);
                        ratingDom[dom_Array[i]] += pref_powers[k];
                    }
                    if (tmp_table.length) {
                        appendPara("Доминирующий механизм:", "h4");
                        appendTable(Array(tmp_table.length).fill(""), [[]], tmp_table);
                    }
                }
                {
                    let tmp_table = [];
                    for (let i = 0; i < block_Array.length; ++i)
                    {
                        tmp_table.push(names[block_Array[i]]);
                        ratingBlock[block_Array[i]] += pref_powers[k];
                    }
                    if (tmp_table.length) {
                        appendPara("Блокирующий механизм:", "h4");
                        appendTable(new Array(tmp_table.length).fill(""), [[]], tmp_table);
                    }
                }
            appendPara("Турнирный механизм:", "h4");

            //данные по турнирному механизму
            for (let i = 0; i < turnir_Array.length; ++i)
            {
                ratingTurnir[i] += turnir_Array[i];
            }
            markRow(appendTable(turnir_Array, ["Балл"], names, ["Вариант"]),
            getElemWithMaxValue(turnir_Array)+1);

            //данные по K-max механизму
            for (let i = 0; i < VARIANT; ++i)
            {
                for (let j = 0; j < 4; j++)
                {
                    kmax[i] += Karray[i][j] * pref_powers[k];
                }
            }
            //данные по K-opt
            for (let i = 0; i < VARIANT; ++i)
            {
                if ((kopt_Array[i] == 1) || (kopt_Array[i] == 2) ||
                (kopt_Array[i] == 3) || (kopt_Array[i] == 4))
                {
                    for (let j = 0; j < 4; j++)
                    {
                        kopt[i] += Karray[i][j] * pref_powers[k];
                    }
                }
            }
        }

        appendPara("", "hr");  // Горизонтальная линия-разделитель

        appendPara("ИТОГОВЫЙ РЕЗУЛЬТАТ:", "h3");
        const result_left = ["Вариант"];
        const result_head = ["Балл", "Место"];
        var rating_place = new Array(VARIANT).fill(0);  //int
        placeRating(ratingDom, rating_place);
        appendPara("Механизм доминирования", "h3");
        appendPara("Баллы вариантов с учётом весовых коэффициентов и места вариантов:");
        {
            let tmp_table = [];
            for (let i = 0; i < VARIANT; ++i)
            {
                tmp_table.push([ratingDom[i],
                rating_place[i]]);
            }
            //tmp_table.sort(compareByLastColumn);
            markRow(appendTable(tmp_table, result_head, names, result_left),
            getRowWithMaxColumn(tmp_table, 0)+1);
        }

        var rating_place_block = new Array(VARIANT).fill(0);  //int
        placeRating(ratingBlock, rating_place_block);
        appendPara("Механизм блокировки", "h3");
        appendPara("Баллы вариантов с учётом весовых коэффициентов и места вариантов:");
        {
            let tmp_table = [];
            for (let i = 0; i < VARIANT; ++i)
            {
                tmp_table.push([ratingBlock[i],
                rating_place_block[i]]);
            }
            //tmp_table.sort(compareByLastColumn);
            markRow(appendTable(tmp_table, result_head, names, result_left),
            getRowWithMaxColumn(tmp_table, 0)+1);
        }

        var rating_place_turnir = new Array(VARIANT).fill(0);  //int
        placeRating(ratingTurnir, rating_place_turnir);
        appendPara("Турнирный механизм", "h3");
        appendPara("Баллы вариантов с учётом весовых коэффициентов и места вариантов:");
        {
            let tmp_table = [];
            for (let i = 0; i < VARIANT; ++i)
            {
                tmp_table.push([ratingTurnir[i],
                rating_place_turnir[i]]);
            }
            //tmp_table.sort(compareByLastColumn);
            markRow(appendTable(tmp_table, result_head, names, result_left),
            getRowWithMaxColumn(tmp_table, 0)+1);
        }

        var rating_place_kmax = new Array(VARIANT).fill(0);  //int
        var rating_place_kopt = new Array(VARIANT).fill(0);  //int
        placeRating(kmax, rating_place_kmax);
        placeRating(kopt, rating_place_kopt);
        appendPara("Механизм K-MAX", "h3");
        appendPara("Баллы вариантов с учётом весовых коэффициентов и места вариантов:");
        {
            let tmp_table = [];
            for (let i = 0; i < VARIANT; ++i)
            {
                tmp_table.push([kmax[i],
                rating_place_kmax[i],
                kopt[i],
                rating_place_kopt[i]]);
            }
            //tmp_table.sort(compareByLastColumn);
            markRow(appendTable(tmp_table, ["K-max", "Место", "K-opt", "Место"], names, result_left),
            getRowWithMaxColumn(tmp_table, 0)+1);
        }

        appendPara("", "hr");  // Горизонтальная линия-разделитель
        appendPara("Балльная система", "h3");
        appendPara("Итоговая таблица с баллами по каждому механизму:", "h3");

        {
            let sums = [];  //int
            let rating_place_final = new Array(VARIANT).fill(0);  //int
            let t_head = ["Блок", "Дом", "Тур", "K-max", "K-opt", "Сумма", "Место"];
            let tmp_table = [];
            for (let i = 0; i < VARIANT; ++i)
            {
                let block_value = VARIANT + 1 - rating_place_block[i];
                let dom_value = VARIANT + 1 - rating_place[i];
                let turn_value = VARIANT + 1 - rating_place_turnir[i];
                let kmax_value = VARIANT + 1 - rating_place_kmax[i];
                let kopt_value = VARIANT + 1 - rating_place_kopt[i];
                let sum = dom_value + block_value + turn_value + kmax_value + kopt_value;
                tmp_table.push([block_value,
                dom_value,
                turn_value,
                kmax_value,
                kopt_value,
                sum,
                ]);
                sums.push(sum);
            }
            placeRating(sums, rating_place_final);
            markRow(appendTable(pushCol(tmp_table, rating_place_final), t_head, names, result_left),
            getRowWithMaxColumn(tmp_table, 5)+1);
        }

        appendPara("", "h3").innerHTML = "&nbsp;";  // Пустая строка
        return 0;
    }

        function build_matrix(vars, greater, matrix)
        {
            for (let i = 0; i < vars.length; ++i)
            {
                for (let j = 0; j < vars.length; ++j)
                {
                    if (i == j)
                    matrix[i][j] = -1
                    else if (!greater && vars[i] <= vars[j])
                    matrix[i][j] = 1;
                    else if (greater && vars[i] >= vars[j])
                    matrix[i][j] = 1;
                }
            }
        }

    // Определение блокирующего, или доминирующего варианта
        function blockDomMechanism(arr, n, m, block)
        {
            var estimates = [];  //int
            var reached;  //bool
            for (let i = 0; i < n; i++)
            {
                reached = true;
                for (let j = 0; j < m; j++)
                {
                    if (i != j) {
                        if ((block ? arr[j][i] != 0 : arr[i][j] != 1))
                        {
                            reached = false;
                            break;
                        }
                    }
                }
                if (reached) {
                estimates.push(i);
                }
            }
            return estimates;
        }

    // Определение турнирного варианта
        function turnir(arr, power, n, m, number)
        {
            var turnir_str_Array = [];  //double
            var turnir_str;  //bool
            for (let i = 0; i < n; i++)
            {
                var sum = 0;  //double
                for (let j = 0; j < m; j++)
                {
                    if (arr[i][j] == 1 && i != j)
                    {
                        sum += (arr[j][i] == 0 ? power[number] : power[number] / 2);
                    }
                }
                turnir_str_Array.push(sum);
            }
            return turnir_str_Array;
        }

    // Составление массива для варианта в случае механизма K - max
        function createKarray(arr, n, m)
        {
            // 2D массив VARIANT x 4, заполненный нулями
            const A = new Array(VARIANT).fill().map(() =>
            new Array(4).fill(0));

            for (let i = 0; i < n; i++)
            {
                var HR0 = 0;  //double
                var ER = 0;  //double
                var NK = 0;  //double
                for (let j = 0; j < m; j++)
                {
                    if (i == j) continue;
                    if (arr[i][j] == 1)
                    {
                        HR0 += (arr[j][i] == 0 ? 1 : 0);
                        ER += (arr[j][i] == 1 ? 1 : 0);
                    }
                    if (arr[i][j] == -1)
                    {
                        NK += 1;
                    }
                }
                for (let j = 0; j < 4; j++)
                {
                    switch (j)
                    {
                        case 0:
                        A[i][j] = HR0 + ER + NK;
                        break;
                        case 1:
                        A[i][j] = HR0 + NK;
                        break;
                        case 2:
                        A[i][j] = HR0 + ER;
                        break;
                        case 3:
                        A[i][j] = HR0;
                    }
                }
            }
            return A;
        };

    // Определение K-opt вариантов
        function createKopt(arr, n, kopt_Array)
        {
            for (let i = 0; i < n; i++)
            {
                for (let j = 0; j < 4; j++)
                {
                    switch (j)
                    {
                        case 0:
                        if (arr[i][j] == n)
                        {
                            kopt_Array[i] = 1;
                        }
                        break;
                        case 1:
                        if ((arr[i][j] == (n - 1)) && (arr[i][j] > arr[i][j + 2]))
                        {
                            kopt_Array[i] = 2;
                        }
                        break;
                        case 2:
                        if ((arr[i][j] == n) && (arr[i][j] > arr[i][j + 1]))
                        {
                            kopt_Array[i] = 3;
                        }
                        break;
                        case 3:
                        if ((arr[i][j] == (n - 1)) && (arr[i][j] == arr[i][j - 1]) &&
                        (arr[i][j] == arr[i][j - 2]))
                        {
                            kopt_Array[i] = 4;
                        }
                        break;
                        default:
                        kopt_Array[i] = 0;
                    }
                }
            }
        }

    // Двумерный массив для вывода, K-opt механизм
        function makeArrKopt(arr, n, m, opt)
        {
            var ret = [];
            for (let i = 0; i < n; i++)
            {
                let  s = [];
                for (let j = 0; j < m; j++)
                {
                    s.push(arr[i][j]);
                }
                switch (opt[i])
                {
                    case 1:
                    s.push("максимальный");
                    break;
                    case 2:
                    s.push("строго максимальный");
                    break;
                    case 3:
                    s.push("наибольший");
                    break;
                    case 4:
                    s.push("строго наибольший");
                    break;
                    default:
                    s.push("");
                }
                ret.push(s);
            }
            return ret;
        }

    // Расстановка мест
        function placeRating(arr, A)
        {
            var place = new Array(VARIANT).fill(0);
            var number = new Array(VARIANT);
            for (let i = 0; i < VARIANT; ++i)
            {
                number[i] = i + 1;
            }
            for (let i = 0; i < VARIANT; i++)
            {
                place[i] = arr[i];
            }
            // Сортировка массива в обратном порядке
            place.sort(function(a,b) { return b - a; });
            var pl = 0;  //int
            for (let i = 0; i < VARIANT; ++i)  // По массиву place
            {
                if ((i != 0) && (place[i] == place[i - 1]))
                {
                    continue;
                }
                for (let j = 0; j < VARIANT; j++)  // По массиву arr
                {
                    if (arr[j] == place[i])
                    {
                        //A[j] = i + 1;
                        A[j] = number[pl];
                    }
                }
                pl++;
                if (place[i] == 0) break;
            }
        }

        function compareByLastColumn(a, b) {
            var last = a.length-1
            if (a[last] === b[last]) {
                return 0;
            }
            else {
                return (a[last] < b[last]) ? -1 : 1;
            }
        }
        function compareByLastColumnReverse(a, b) {
            var last = a.length-1
            if (a[last] === b[last]) {
                return 0;
            }
            else {
                return (a[last] > b[last]) ? -1 : 1;
            }
        }

    }

        return;  // Дальше только функции

    // Оставить указанное количество знаков после запятой
        function ffix(f, n=6) {
            return parseFloat(f.toFixed(n));
        }

        function tfix(f, n=6) {
            return (n > 0) ? Math.round(f*n*10)/(n*10) : Math.round(f);
        }

        function markRow(table, rowN, class_="yellow") {
            table.getElementsByTagName('tr')[rowN].classList.toggle(class_);
        }

    // Вкл/выкл стиль для колонки таблицы
        function markCol(table, colN, class_="gray") {
                for (let row of table.getElementsByTagName('tr')) {
                row.getElementsByTagName('td')[colN].classList.toggle(class_);
            }
        }

    // Добавление параграфа текста в тело страницы
        function appendPara(text="", tag="p") {
            var el = document.createElement(tag);
            el.appendChild(document.createTextNode(text));
            document.body.appendChild(el);
            return el;
        }

    // Добавление таблицы с заголовком и левым столбцом в тело страницы
        function appendTable(tableData, headRow=[], leftColumn=[], topLeft="") {
            var rows = tableData.length;  // Число рядов (строк) в таблице
            var cols = tableData[0].length;  // Число колонок
            // Если нет заголовков, добавляем сверху ряд пустых ячеек, иначе ряд headRow
            var headRow_ = (headRow.length != 0) ? headRow : Array(cols).fill("");
            var tableData_ = [headRow_].concat(tableData);
            // Если нет левой колонки, создаём пустую, иначе используем leftColumn
            var leftColumn_ = (leftColumn.length != 0) ? leftColumn : Array(rows).fill("");
            // Добавляем элемент верхнего левого угла в начало левой колонки
            leftColumn_ = [topLeft].concat(leftColumn_);

            var table = document.createElement('table');
            var tableBody = document.createElement('tbody');

            var r = 0;  // Счётчик строк
            tableData_.forEach(function(rowData) {  // Для каждой строки
                var row = document.createElement('tr');
                // Добавляем левую ячейку из leftColumn к каждой строке
                rowData_ = [leftColumn_[r++]].concat(rowData);

                rowData_.forEach(function(cellData) {  // Для каждой ячейки
                    // Если число, то избавляемся от девяток в периоде
                    cellData_= (typeof cellData == 'number') ? tfix(cellData) : cellData;
                    var cell = document.createElement('td');
                    cell.appendChild(document.createTextNode(cellData_));
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });

            table.appendChild(tableBody);
            document.body.appendChild(table);
            return table;
        }

    // Добавление таблицы в тело страницы
        function appendTableOrig(tableData) {
            var table = document.createElement('table');
            var tableBody = document.createElement('tbody');

            tableData.forEach(function(rowData) {
                var row = document.createElement('tr');

                rowData.forEach(function(cellData) {
                    var cell = document.createElement('td');
                    cell.appendChild(document.createTextNode(cellData));
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });

            table.appendChild(tableBody);
            document.body.appendChild(table);
        }

        function getElemWithMaxValue(arr) {
            return arr.reduce((accumulator, current, index) => {
                return current > arr[accumulator] ? index : accumulator;
            }, 0);
        }

        function getRowWithMaxColumn(rows, column) {
            return rows.reduce((accumulator, current, index) => {
                return current[column] > rows[accumulator][column] ? index : accumulator;
            }, 0);
        }

    // Транспонирование двумерного массива
        function transpose(array) {
            return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
        }

    // Добавление колонки справа (возвращает новый массив, старые не меняются)
        function pushCol(arr2d, arr) {
            return transpose([...transpose(arr2d), ...[arr]]);
        }
    }