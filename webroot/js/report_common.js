function koReportModel() {
    var self = this;

    /**
     * REPORT TABLES
     */

    self.selectedTable = ko.observable('');

    self.pageOptions = [10, 25, 50, 100];
    self.selectedPageOption = ko.observable(10);

    // Normal Table
    self.currentReport = ko.observable(); // processed data
    self.reportMode = ko.observable('browse'); // browse or search
    self.lastReportID = ko.observable(0);

    self.totalResults = ko.observable(0);
    self.resultsLeft = ko.observable(0);

    self.totalConsolidateResults = ko.observable(0);
    self.consolidateResultsLeft = ko.observable(0);

    self.filters = ko.observableArray();
    self.newFilterColumn = ko.observable();
    self.newFilterValue = ko.observable();
    self.isAdmin = ko.observable(false);

    self.loadingData = ko.observable(false);
    self.loadingConsolidationData = ko.observable(false);
    
    self.cancelFilter = function() {
        self.reportMode('browse');
        self.filters.removeAll();
        self.applyFilters();
    };

    self.toggleSearch = function( ) {
        self.reportMode() == 'browse' ? self.reportMode('search') : self.reportMode('browse');
    };

    self.addFilter = function() {
        if (self.newFilterColumn() == null || self.newFilterValue() == null || self.newFilterValue() == "") {
            return;
        }
        var filter = {
            column: self.newFilterColumn(),
            value: self.newFilterValue()
        };

        self.newFilterColumn(null);
        self.newFilterValue(null);

        self.filters.push(filter);
        self.applyFilters();
    };

    self.removeFilter = function(filter) {
        self.filters.remove(filter);
        self.applyFilters();
    };

    self.applyFilters = function() {
        var filterString = "";
        if (self.filters().length > 0) {
            filterString += "sc=" + self.filters().length + '&';
        }
        for (var i = 0; i < self.filters().length; i++) {
            var thisFilter = self.filters()[i];
            var filterPos = self.currentReport().headers.indexOf(thisFilter.column);
            var filterCol = null;
            if (thisFilter.column == 'ID') {
                filterCol = 'ID';
            } else {
                for (var j = 0; j < tableFilters.length; j++) {
                    if (tableFilters[j].tableName === self.currentReport().name.tableName) {
                        filterCol = tableFilters[j].filters[filterPos - 1];
                        break;
                    }
                }
            }
            filterString += '&st' + i + '=' + filterCol + '&sv' + i + '=' + thisFilter.value;
        }
        self.loadTableData(false, self.selectedTable(), filterString, self.lastReportID, self.resultsLeft, self.totalResults, self.currentReport, self.loadingData);
    };

    // Consolidate Modal
    self.consolidateReport = ko.observable(); // processed data
    self.consolidateMode = ko.observable('browse'); // browse or search
    self.lastConsolidateReportID = ko.observable(0); // raw data

    self.consolidateFilters = ko.observableArray();
    self.newConsolidateFilterColumn = ko.observable();
    self.newConsolidateFilterValue = ko.observable();

    self.toggleConsolidateSearch = function( ) {
        self.consolidateMode() == 'browse' ? self.consolidateMode('search') : self.consolidateMode('browse');
    };

    self.addConsolidateFilter = function() {
        if (self.newConsolidateFilterColumn() == null) {
            return;
        }
        var filter = {
            column: self.newConsolidateFilterColumn(),
            value: self.newConsolidateFilterValue()
        };

        self.newConsolidateFilterColumn(null);
        self.newConsolidateFilterValue(null);

        self.consolidateFilters.push(filter);
        self.applyConsolidateFilters();
    };

    self.removeConsolidateFilter = function(filter) {
        self.consolidateFilters.remove(filter);
        self.applyConsolidateFilters();
    };

    self.applyConsolidateFilters = function() {
        var filterString = "";
        if (self.consolidateFilters().length > 0) {
            filterString += "sc=" + self.consolidateFilters().length + '&';
        }
        for (var i = 0; i < self.consolidateFilters().length; i++) {
            var thisFilter = self.consolidateFilters()[i];
            var filterPos = self.consolidateReport().headers.indexOf(thisFilter.column);
            var filterCol = null;
            for (var j = 0; j < tableFilters.length; j++) {
                if (tableFilters[j].tableName === self.consolidateReport().name.tableName) {
                    filterCol = tableFilters[j].filters[filterPos];
                    break;
                }
            }
            filterString += '&st' + i + '=' + filterCol + '&sv' + i + '=' + thisFilter.value;
        }
        self.loadTableData(false, self.selectedTable(), filterString, self.lastConsolidateReportID, self.consolidateResultsLeft, self.totalConsolidateResults, self.consolidateReport, self.loadingConsolidationData);
    };

    self.availableFilters = ko.computed(function() {
        var filters = [];
        if (self.currentReport() == null || self.currentReport().headers == null) {
            return filters;
        }
        for (var i = 0; i < self.currentReport().headers.length; i++) {
            var thisHeader = self.currentReport().headers[i];
            if (thisHeader == 'Uploaded At' || thisHeader == 'Select' || thisHeader == "Replaced By" || thisHeader == 'Meeting Date/Time') {
                continue;
            }
            filters.push(thisHeader);
        }
        return filters;
    });

    self.availableConsolidateFilters = ko.computed(function() {
        var filters = [];
        if (self.consolidateReport() == null || self.consolidateReport().headers == null) {
            return filters;
        }
        for (var i = 0; i < self.consolidateReport().headers.length; i++) {
            var thisHeader = self.consolidateReport().headers[i];
            if (thisHeader == 'Uploaded At' || thisHeader == 'Select' || thisHeader == "Replaced By" || thisHeader == 'Meeting Date/Time') {
                continue;
            }
            filters.push(thisHeader);
        }
        return filters;
    });

    /** SHOW USER DETAILS MODAL **/

    self.userInfo = ko.observable(null);
    self.showUserDetails = function(userInfo) {
        self.userInfo(userInfo);
    };

    self.respondentInfo = ko.observable(null);
    self.focusGroupInfo = ko.observable(null);
    self.siteInfo = ko.observable(null);
    self.projectInfo = ko.observable(null);
    self.showRespondentDetails = function(reportRow, respondentInfo) {
        for (var i = 0; i < reportRow.length; i++) {
            if (reportRow[i].key != null) {
                if (reportRow[i].key === "respondent") {
                    self.respondentInfo(reportRow[i]);
                }
                if (reportRow[i].key === "focusGroup") {
                    self.focusGroupInfo(reportRow[i]);
                }
                if (reportRow[i].key === "site") {
                    self.siteInfo(reportRow[i]);
                }
                if (reportRow[i].key === "project") {
                    self.projectInfo(reportRow[i]);
                }
            }
        }

    };

    self.selectedTable.subscribe(function(newTable) {
        self.reportMode('browse');
        self.filters.removeAll();
        self.consolidateReport(null);
        self.lastConsolidateReportID(0);
        self.currentReport(null);
        self.lastReportID(0);
        self.userInfo(null);
        self.resultsLeft(0);
        self.totalResults(0);
        self.consolidateResultsLeft(0);
        self.totalConsolidateResults(0);
        self.loadTableData(false, newTable, null, self.lastReportID, self.resultsLeft, self.totalResults, self.currentReport, self.loadingData);
    });

    // Normal Table
    self.showMore = function() {
        self.loadTableData(true, self.currentReport().name, null, self.lastReportID, self.resultsLeft, self.totalResults, self.currentReport, self.loadingData);
    };
    // Consolidation Table
    self.showMoreConsolidate = function() {
        self.loadTableData(true, self.consolidateReport().name, null, self.lastConsolidateReportID, self.consolidateResultsLeft, self.totalConsolidateResults, self.consolidateReport, self.loadingConsolidationData);
    };

    self.loadTableData = function(showMore, newTable, filterString, lastReportID, resultsLeft, totalResults, reportObservable, isLoading) {
        if (showMore) {
            var lastID = lastReportID();
        } else {
            lastID = 0;
        }
        var args = showMore ? '?last=' + lastID : '';
        args += (filterString != null) ? ((args !== '' ? '&' : '?') + filterString) : '';
        args += self.isAdmin() ? ((args !== '' ? '&' : '?') + 'isAdmin=true') : '';
        var dataURL = '/api/user/data/' + newTable.dbTableName + args;
        isLoading(true);
        getData(dataURL, function(data) {
            self.processResults(data, showMore, newTable, lastReportID, resultsLeft, totalResults, reportObservable, isLoading);
        });
    };

    self.processResults = function(data, showMore, newTable, lastReportID, resultsLeft, totalResults, reportObservable, isLoading) {
        var report = {};
        if (showMore) {
            report = reportObservable();
            resultsLeft(data.results.count - 100);
        } else {
            report.data = ko.observableArray();
            if (newTable.dbTableName != "project" && baseTableHeaders.indexOf('Uploaded At') == -1) {
                baseTableHeaders.push('Uploaded At');
            } else if (newTable.dbTableName == "project" && baseTableHeaders.indexOf('Uploaded At') > -1) {
                baseTableHeaders.pop();
            }
            report.headers = baseTableHeaders;
            report.name = newTable;
            totalResults(data.results.count);
            resultsLeft(data.results.count - 100);
        }
        var currentUser = data.results.currentUser;
        var specificHeaders = [];
        for (var i = 0; i < data.results.data.length; i++) {
            var thisRow = data.results.data[i];
            if (thisRow.id > lastReportID()) {
                lastReportID(thisRow.id);
            }
            var userInfo = null;
            if (thisRow.user == null) {
                userInfo = "N/A";
            } else {
                /*userInfo = {
                    action: 'usermodal',
                    id: thisRow.user.id,
                    name_first: thisRow.user.name_first,
                    name_last: thisRow.user.name_last,
                    contact_email: thisRow.user.contact_email
                };*/
                userInfo = {
                    action: 'tooltip',
                    key: 'focusGroup',
                    text: thisRow.user.id,
                    title: thisRow.user.name_first + ' ' + thisRow.user.name_last + ' (' + thisRow.user.contact_email + ')'
                };
            }
            var thisReportRow = [thisRow.id, userInfo];
            if (report.name.dbTableName != "project") {
                thisReportRow.push(thisRow.uploaded_at == null ? "N/A" : moment(thisRow.uploaded_at).format("L LT"));
            }
            report.canRevise = false;
            switch (report.name.dbTableName) {
                case "animal_category":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    var speciesName = thisRow.animal_specy == null ? "N/A" : thisRow.animal_specy.description;
                    thisReportRow = thisReportRow.concat([speciesName, thisRow.description]);
                    break;
                case "animal_species": // Note: CakePHP "helpfully" renames "species" to singular "specy" [sic] on a join.:P
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.description]);
                    break;
                case "animal_type":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    var speciesName = thisRow.animal_category.animal_specy == null ? "N/A" : thisRow.animal_category.animal_specy.description;
                    var isLactating = thisRow.animal_category.animal_specy == null ? "N/A" : thisRow.animal_category.animal_specy.lactating;
                    var isDairy = thisRow.animal_category.animal_specy == null ? "N/A" : thisRow.animal_category.animal_specy.dairy;
                    thisReportRow = thisReportRow.concat([speciesName, thisRow.animal_category.description, thisRow.description, isLactating, isDairy, thisRow.weight_lower_limit, thisRow.weight_upper_limit]);
                    break;
                case "community_type":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.description]);
                    break;
                case "core_context_attribute_score":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.core_context_attribute.core_context_attribute_type.description, thisRow.core_context_attribute.prompt, thisRow.techfit_scale.number, thisRow.id_techfit_assessment]);
                    break;
                case "crop_cultivation":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.crop_type.name, thisRow.cultivated_land, thisRow.unit_area.name, thisRow.annual_yield, thisRow.unit_mass_weight.name]);
                    break;
                case "crop_type":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name, thisRow.harvest_index, thisRow.content_percent_dry_matter, thisRow.content_metabolisable_energy, thisRow.content_crude_protein]);
                    break;
                case "feed_source":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.id_site, thisRow.description]);
                    break;
                case "feed_source_availability":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.feed_source.description, thisRow.month.name, thisRow.contribution]);
                    break;
                case "focus_group":
                    var keyCols = self.processKeyColumns(thisRow, false, false, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    report.canRevise = true;
                    report.addMapIcon = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, thisRow.community]);
					if(self.isAdmin || (userInfo != 'N/A' && userInfo.id == currentUser)) {
						thisReportRow.push({action: 'text', key: 'venue_name', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.venue_name)});
						thisReportRow.push({action: 'text', key: 'meeting_date_time', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.meeting_date_time)});
					} else {
						thisReportRow.push(thisRow.venue_name);
						thisReportRow.push(thisRow.meeting_date_time);
					}
                    break;
                case "focus_group_monthly_statistics":
                    var keyCols = self.processKeyColumns(thisRow, false, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, thisRow.month.name, thisRow.scale_zero_five.number]);
                    break;
                case "fodder_crop_cultivation":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.fodder_crop_type.name, thisRow.cultivated_land, thisRow.unit_area.name]);
                    break;
                case "fodder_crop_type":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name, thisRow.annual_dry_matter_per_hectare, thisRow.content_metabolisable_energy, thisRow.content_crude_protein]);
                    break;
                case "income_activity":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.income_activity_type.description, thisRow.income_activity_type.income_activity_category.description, thisRow.percent_of_hh_income]);
                    break;
                case "income_activity_type":
                    report.canKeepPrivate = true;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.description, thisRow.income_activity_category.description]);
                    break;
                case "intervention":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.description]);
                    break;
                case "project":
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    report.canRevise = true;
                    specificHeaders = newTable.tableHeaders;
                    (self.isAdmin || (userInfo != 'N/A' && userInfo.id == currentUser)) ? thisReportRow.push({action: 'text', key: 'title', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.title)}) : thisReportRow.push(thisRow.title);
                    thisReportRow.push(thisRow.description);
                    (self.isAdmin || (userInfo != 'N/A' && userInfo.id == currentUser)) ? thisReportRow.push({action: 'text', key: 'start_date', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.start_date)}) : thisReportRow.push(thisRow.start_date);
                    break;
                case "labour_activity":
                    var keyCols = self.processKeyColumns(thisRow, false, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;

                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, thisRow.description, thisRow.daily_rate_male, thisRow.daily_rate_female]);
                    break;
                case "livestock_holding":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    var animalDesc = thisRow.animal_type == null ? "N/A" : thisRow.animal_type.description;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, animalDesc, thisRow.headcount, thisRow.average_weight]);
                    break;
                case "livestock_sale":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    var speciesName = thisRow.livestock_sale_category.animal_specy == null ? "N/A" : thisRow.livestock_sale_category.animal_specy.description;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, speciesName, thisRow.livestock_sale_category.gender.description, thisRow.number_sold, thisRow.approximate_weight]);
                    break;
                case "livestock_sale_category":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    var speciesName = thisRow.animal_specy == null ? "N/A" : thisRow.animal_specy.description;
                    thisReportRow = thisReportRow.concat([speciesName, thisRow.gender.description]);
                    break;
                case "purchased_feed":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    var currency = null;
                    if (thisRow.feed_currency == null) {
                        currency = thisRow.respondent.focus_group_view.site_view.currency.name;
                    } else {
                        currency = thisRow.feed_currency.name;
                    }
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.purchased_feed_type.name, thisRow.quantity_purchased, thisRow.unit_mass_weight.name, thisRow.purchases_per_year, thisRow.unit_price, currency]);
                    break;
                case "purchased_feed_type":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name, thisRow.percent_dry_matter, thisRow.content_metabolisable_energy, thisRow.content_crude_protein]);
                    break;
                case "respondent":
                    var keyCols = self.processKeyColumns(thisRow, false, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, thisRow.gender.description, thisRow.landholding_category.description, thisRow.head_of_household_occupation, thisRow.diet_percent_grazing, thisRow.diet_percent_collected_fodder]);
                    break;
                case "respondent_monthly_statistics":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.month.name, thisRow.milk_average_yield, thisRow.milk_average_price_litre, thisRow.milk_retained_for_household, thisRow.market_price_cattle, thisRow.market_price_sheep, thisRow.market_price_goat]);
                    break;
                case "season":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name]);
                    break;
                case "site":
                    var keyCols = self.processKeyColumns(thisRow, false, false, false, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    report.canRevise = true;
                    report.addMapIcon = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow.push(keyCols.project);
                    (self.isAdmin || (userInfo != 'N/A' && userInfo.id == currentUser)) ? thisReportRow.push({action: 'text', key: 'name', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.name)}) : thisReportRow.push(thisRow.name);
                    (self.isAdmin || (userInfo != 'N/A' && userInfo.id == currentUser)) ? thisReportRow.push({action: 'text', key: 'major_region', 'index': i, rowID: thisRow.id, value: ko.observable(thisRow.major_region)}) : thisReportRow.push(thisRow.major_region);
                    thisReportRow.push(thisRow.system_country == null ? 'N/A' : thisRow.system_country.name);
                    break;
                case "unit_area":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name, thisRow.conversion_ha]);
                    break;
                case "unit_mass_weight":
                    report.canKeepPrivate = false;
                    report.canExclude = false;
                    report.canConsolidate = true;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([thisRow.name, thisRow.conversion_kg]);
                    break;
                case "womens_income_activity":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    keyCols.incomeActivityType = {
                        action: 'tooltip',
                        key: 'incomeActivityType',
                        text: thisRow.income_activity_type.id,
                        title: thisRow.income_activity_type.description
                    };
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, keyCols.incomeActivityType, thisRow.pct_womens_income]);
                    break;
                case "feed_labor_division":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    keyCols.feedLaborType = {
                        action: 'tooltip',
                        key: 'feedLaborType',
                        text: thisRow.feed_labor_type.id,
                        title: thisRow.feed_labor_type.description
                    };
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, keyCols.feedLaborType, thisRow.labor_division_group.description]);
                    break;
                case "decision_making_by_household":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    keyCols.decision = {
                        action: 'tooltip',
                        key: 'decision',
                        text: thisRow.decision.id,
                        title: thisRow.decision.description
                    };
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, keyCols.decision, thisRow.gender_group.description]);
                    break;
                case "coop_membership":
                    var keyCols = self.processKeyColumns(thisRow, true, true, true, true);
                    report.canKeepPrivate = true;
                    report.canExclude = true;
                    report.canConsolidate = false;
                    specificHeaders = newTable.tableHeaders;
                    thisReportRow = thisReportRow.concat([keyCols.project, keyCols.site, keyCols.focusGroup, keyCols.respondent, thisRow.name_free_entry, thisRow.membership_count_male, thisRow.membership_count_female]);
                    break;
                default:
            }

            if (report.addMapIcon) {
                thisReportRow.push({action: 'mapmodal', key: report.name.dbTableName, value: thisRow.id});
            }

            if (report.canKeepPrivate) {
                thisReportRow.push({action: 'checkbox', key: 'private', value: ko.observable(thisRow.keep_private)});
            }
            if (report.canExclude) {
                thisReportRow.push({action: 'checkbox', key: 'exclude', value: ko.observable(thisRow.exclude)});
            }
            if (report.canConsolidate) {
                thisReportRow.push({action: 'replacedmodal', key: 'consolidate', value: ko.observable(thisRow.replaced_by_id)});
            }

            thisReportRow.push({action: 'checkbox', key: 'selectRow', rowID: thisRow.id, value: ko.observable(false)});

            report.data.push(thisReportRow);
        }

        if (!showMore) {
            report.headers = report.headers.concat(specificHeaders);

            if (report.addMapIcon) {
                report.headers.push("Map");
            }

            if (report.canKeepPrivate) {
                report.headers.push("Private");
            }

            if (report.canExclude) {
                report.headers.push("Exclude");
            }

            if (report.canConsolidate) {
                report.headers.push("Replaced By")
            }

            report.headers.push("Select");
        }

        reportObservable(report);
        isLoading(false);
    };

    /**
     * Get respondent/focus group/site/project records depending on which parents are available.
     */
    self.processKeyColumns = function(thisRow, hasR, hasF, hasS, hasP) {
        var keyCols = {};
        if (hasR) {
            /*keyCols.respondent = {
                action: 'respondentmodal',
                key: 'respondent',
                id: thisRow.respondent.id,
                uniqueID: thisRow.respondent.unique_identifier
            };*/
            console.log(thisRow);
            keyCols.respondent = {
                action: 'tooltip',
                key: 'respondent',
                text: thisRow.respondent.id,
                title: thisRow.respondent.name
            };
        }
        if (hasR && hasF) {
            keyCols.focusGroup = {
                action: 'tooltip',
                key: 'focusGroup',
                text: thisRow.respondent.focus_group_view.id,
                title: thisRow.respondent.focus_group_view.venue_name
            };
            /*keyCols.focusGroup = {
                action: 'respondentmodal',
                key: 'focusGroup',
                id: thisRow.respondent.focus_group_view.id,
                community: thisRow.respondent.focus_group_view.community,
                venue_name: thisRow.respondent.focus_group_view.venue_name,
                meeting_date_time: moment(thisRow.respondent.focus_group_view.meeting_date_time).format("L LT")
            };*/
        } else if (hasF) {
            keyCols.focusGroup = {
                action: 'tooltip',
                key: 'focusGroup',
                text: thisRow.focus_group_view.id,
                title: thisRow.focus_group_view.venue_name
            };
            /*keyCols.focusGroup = {
                action: 'respondentmodal',
                key: 'focusGroup',
                id: thisRow.focus_group_view.id,
                community: thisRow.focus_group_view.community,
                venue_name: thisRow.focus_group_view.venue_name,
                meeting_date_time: moment(thisRow.focus_group_view.meeting_date_time).format("L LT")
            };*/
        }
        if (hasR && hasF && hasS) {
            keyCols.site = {
                action: 'tooltip',
                key: 'site',
                text: thisRow.respondent.focus_group_view.site_view.id,
                title: thisRow.respondent.focus_group_view.site_view.name
            };
        } else if (hasF && hasS) {
            keyCols.site = {
                action: 'tooltip',
                key: 'site',
                text: thisRow.focus_group_view.site_view.id,
                title: thisRow.focus_group_view.site_view.name
            };
        } else if (hasS) {
            if (thisRow.site_view) {
                keyCols.site = {
                    action: 'tooltip',
                    key: 'site',
                    text: thisRow.site_view.id,
                    title: thisRow.site_view.name
                };
            }
        }
        if (hasR && hasF && hasS && hasP) {
            keyCols.project = {
                action: 'tooltip',
                key: 'project',
                text: thisRow.respondent.focus_group_view.site_view.project_view.id,
                title: thisRow.respondent.focus_group_view.site_view.project_view.title
            };
        } else if (hasF && hasS && hasP) {
            keyCols.project = {
                action: 'tooltip',
                key: 'project',
                text: thisRow.focus_group_view.site_view.project_view.id,
                title: thisRow.focus_group_view.site_view.project_view.title
            };
        } else if (hasS && hasP) {
            if (thisRow.site_view) {
                keyCols.project = {
                    action: 'tooltip',
                    key: 'project',
                    text: thisRow.site_view.project_view.id,
                    title: thisRow.site_view.project_view.title
                };
            }

        } else if (hasP) {
            keyCols.project = {
                action: 'tooltip',
                key: 'project',
                text: thisRow.project_view.id,
                title: thisRow.project_view.title
            };
        }

        return keyCols;
    };

    self.bulkActions = ko.computed(function() {
        var actions = [];
        if (self.currentReport() == null) {
            return actions;
        }
        if (self.currentReport().canExclude) {
            actions.push('Toggle Exclude');
        }
        if (self.currentReport().canRevise) {
            actions.push('Revise Selected');
            actions.push('Revert Selected');
        }
        if (self.currentReport().canConsolidate) {
            actions.push('Consolidate');
        }
        return actions;
    });

    self.selectedRows = ko.computed(function() {
        var selectedRows = [];
        if (self.currentReport() == null) {
            return selectedRows;
        }
        for (var i = 0; i < self.currentReport().data().length; i++) {
            var thisRow = self.currentReport().data()[i];

            var selectIndex = thisRow.length - 1;

            if (thisRow[selectIndex].value() == true) {
                selectedRows.push(thisRow);
            }
        }
        return selectedRows;
    });

    self.applyChange = function(data, event) {
        var selectRowColumn = 0;
        if (self.selectedTable().dbTableName == "site") {
            selectRowColumn = 10;
        } else if (self.selectedTable().dbTableName == "project") {
            selectRowColumn = 7;
        } else if (self.selectedTable().dbTableName == "focus_group") {
            selectRowColumn = 11;
        }

        if (selectRowColumn > 0) {
            self.currentReport().data()[data.index][selectRowColumn].value(true);
        }
    };
    self.selectedAction = ko.observable(null);
    self.applyAction = function() {
        var data = {
            records: []
        };
        var selectedRows = [];

        for (var i = 0; i < self.currentReport().data().length; i++) {
            var thisRow = self.currentReport().data()[i];
            if (thisRow[thisRow.length - 1].value() == true) {
                data.records.push(thisRow[thisRow.length - 1].rowID);
                if (self.selectedAction() != "Consolidate") {
                    thisRow[thisRow.length - 1].value(false);
                }
                selectedRows.push(thisRow);
            }
        }

        if (data.records.length < 1) {
            return;
        }

        switch (self.selectedAction()) {
            case "Toggle Exclude":
                postData('/api/user/data/' + self.selectedTable().dbTableName + '/exclude', data, function(result) {
                    selectedRows.forEach(function(thisRow) {
                        var excludePos = self.currentReport().headers.indexOf('Exclude');
                        thisRow[excludePos].value(!(thisRow[excludePos].value()));
                    });
                });
                break;
                /*case "Make Public": 
                 postData('/api/user/data/' + self.selectedTable().dbTableName + '/publish', data, function(result) {
                 selectedRows.forEach(function(thisRow) {
                 var privatePos = self.currentReport().headers.indexOf('Private');
                 thisRow[privatePos].value(false);
                 });
                 });
                 break; */
            case "Consolidate":
                self.consolidateReport(null);
                self.lastConsolidateReportID(0);

                self.loadTableData(false, self.currentReport().name, null, self.lastConsolidateReportID, self.consolidateResultsLeft, self.totalConsolidateResults, self.consolidateReport, self.loadingConsolidationData);
                $('#consolidation-modal').modal('show');
                break;
            case "Revise Selected":
                var aliasData = {
                    records: []
                };
                selectedRows.forEach(function(thisRow) {
                    if (self.selectedTable().dbTableName == 'project') {
                        aliasData.records.push({id: thisRow[0], title: thisRow[2].value(), start_date: thisRow[4].value()});
                    } else if (self.selectedTable().dbTableName == 'site') {
                        aliasData.records.push({id: thisRow[0], name: thisRow[4].value(), major_region: thisRow[5].value()});
                    } else if (self.selectedTable().dbTableName == 'focus_group') {
                        aliasData.records.push({id: thisRow[0], venue_name: thisRow[6].value(), meeting_date_time: thisRow[7].value()});
                    }
                });
                postData('/api/user/data/' + self.selectedTable().dbTableName + '/alias', aliasData, function(result) {
                    console.log(result);
                });
                break;
            case "Revert Selected":
                var aliasData = {
                    records: []
                };
                selectedRows.forEach(function(thisRow) {
                    if (self.selectedTable().dbTableName == 'project'
                        || self.selectedTable().dbTableName == 'site'
                        || self.selectedTable().dbTableName == 'focus_group'
                    ) {
                        aliasData.records.push({id: thisRow[0]});
                    }
                });
                postData('/api/user/data/' + self.selectedTable().dbTableName + '/revert-alias', aliasData, function(result) {
                    console.log(result);
                    selectedRows.forEach(function(thisRow) {
                        Object.keys(result.results).forEach(function(key){
                            var value = result.results[key];
                            if (key == thisRow[0] && value) {
                                Object.keys(result.columns).forEach(function(column){
                                    var columnName = result.columns[column];

                                    if (self.selectedTable().dbTableName == 'focus_group') {
                                        if (column == "venue_name") {
                                            columnName = "Venue";
                                        } else if (column ==  "meeting_date_time") {
                                            columnName = "Meeting Date/Time";
                                        } else if (column.indexOf("gps") != -1) {
                                            columnName = columnName.replace("Gps ", "");
                                        }
                                    }  else if (self.selectedTable().dbTableName == 'project') {
                                        if (column == "title") {
                                            columnName = "Project " + columnName;
                                        }
                                    }

                                    var pos = self.currentReport().headers.indexOf(columnName);
                                    thisRow[pos].value(value[column]);
                                });
                            }
                        });
                    });
                });
                break;
            default:
                return;
        }
    };

    self.consolidateToRecord = function(newRecord) {
        if (!confirm("Are you sure you want to replace the selected record[s] with this record?")) {
            return;
        }
        var data = {
            oldRecords: [],
            newRecord: null
        };
        var oldRecords = self.selectedRows();
        for (var i = 0; i < oldRecords.length; i++) {
            var thisRow = oldRecords[i];
            data.oldRecords.push(thisRow[thisRow.length - 1].rowID);
            thisRow[thisRow.length - 1].value(false); // Deselect row
        }

        data.newRecord = newRecord.rowID;

        postData('/api/user/data/' + self.selectedTable().dbTableName + '/consolidate', data, function(result) {
            self.consolidateReport(null);

            for (var j = 0; j < data.oldRecords.length; j++) {
                for (var k = 0; k < self.currentReport().data().length; k++) {
                    var thisRow = self.currentReport().data()[k];
                    if (thisRow[thisRow.length - 1].rowID === data.oldRecords[j]) {
                        var replacedByPos = self.currentReport().headers.indexOf('Replaced By');
                        thisRow[replacedByPos].value(data.newRecord == data.oldRecords[j] ? null : data.newRecord);
                    }
                }
            }

            self.lastConsolidateReportID(0);
            $('#consolidation-modal').modal('hide');
        });

    };

    self.replacedByRow = ko.observable(null);
    self.showReplacedModal = function(reportRow, rowInfo) {
        if (self.currentReport() == null) {
            return;
        }
        var replacingRow = null;
        for (var i = 0; i < self.currentReport().data().length; i++) {
            var thisRow = self.currentReport().data()[i];
            if (thisRow[thisRow.length - 1].rowID == rowInfo.value()) {
                replacingRow = thisRow;
                break;
            }
        }
        self.replacedByRow(replacingRow);
    };

    self.mapId = ko.observable(null);
    self.showMapModal = function(rowInfo) {
        self.mapId(rowInfo.value);
    };

    /*** MODEL HOUSEKEEPING **/
    self.initialize = function() {
        self.initialized(true);

    };
}

function postData(url, data, callback) {
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType: "json"
    }).done(function(data) {
        callback(data);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        requestFailed(jqXHR, textStatus, errorThrown, uploadModel.lastError);
    });
}

function getData(url, callback) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json"
    }).done(function(data) {
        callback(data);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        requestFailed(jqXHR, textStatus, errorThrown, uploadModel.lastError);
    });
}

var tableFilters = [
    {tableName: 'Animal Category', dbTableName: 'animal_category', filters: ['User.id', 'AnimalCategory.uploaded_at', 'AnimalSpecies.description', 'AnimalCategory.description', 'AnimalCategory.replaced_by_id']},
    {tableName: 'Animal Species', dbTableName: 'animal_species', filters: ['User.id', 'AnimalSpecies.uploaded_at', 'AnimalSpecies.description', 'AnimalDescription.replaced_by_id']},
    {tableName: 'Animal Type', dbTableName: 'animal_type', filters: ['User.id', 'AnimalType.uploaded_at', 'AnimalSpecies.description', 'AnimalCategory.description', 'AnimalType.description', 'AnimalSpecies.lactating', 'AnimalSpecies.dairy', 'AnimalType.weight_lower_limit', 'AnimalType.weight_upper_limit', 'AnimalType.replaced_by_id']},
    {tableName: 'Community Type', dbTableName: 'community_type', filters: ['User.id', 'CommunityType.uploaded_at', 'CommunityType.description', 'CommunityType.replaced_by_id']},
    {tableName: 'Core Context Attribute Score', dbTableName: 'core_context_attribute_score', filters: ['User.id', 'CoreContextAttributeScore.uploaded_at', 'CoreContextAttributeType.description', 'CoreContextAttribute.prompt', 'TechfitScale.number', 'TechfitAssessment.id']},
    {tableName: 'Crop Cultivation', dbTableName: 'crop_cultivation', filters: ['User.id', 'CropCultivation.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'CropType.name', 'CropCultivation.cultivated_land', 'UnitArea.name', 'CropCultivation.annual_yield', 'UnitMassWeight.name', 'CropCultivation.exclude']},
    {tableName: 'Crop Type', dbTableName: 'crop_type', filters: ['User.id', 'CropType.uploaded_at', 'CropType.name', 'CropType.harvest_index', 'CropType.content_percent_dry_matter', 'CropType.content_metabolisable_energy', 'CropType.content_crude_protein', 'CropType.replaced_by_id']},
    {tableName: 'Feed Source', dbTableName: 'feed_source', filters: ['User.id', 'FeedSource.uploaded_at', 'SiteView.id', 'FeedSource.description', 'FeedSource.replaced_by_id']},
    {tableName: 'Feed Source Availability', dbTableName: 'feed_source_availability', filters: ['User.id', 'FeedSourceAvailability.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'FeedSource.description', 'Month.name', 'FeedSourceAvailability.contribution']},
    {tableName: 'Focus Group', dbTableName: 'focus_group', filters: ['User.id', 'FocusGroupView.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.community', 'FocusGroupView.venue_name', 'FocusGroupView.meeting_date_time', 'FocusGroupView.keep_private', 'FocusGroupView.exclude']},
    {tableName: 'Focus Group Monthly Statistics', dbTableName: 'focus_group_monthly_statistics', filters: ['User.id', 'FocusGroupMonthlyStatistics.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Month.name', 'ScaleZeroFive.number', 'FocusGroupMonthlyStatistics.keep_private', 'FocusGroupMonthlyStatistics.exclude']},
    {tableName: 'Fodder Crop Cultivation', dbTableName: 'fodder_crop_cultivation', filters: ['User.id', 'FodderCropCultivation.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'FodderCropType.name', 'FodderCropCultivation.cultivated_land', 'UnitArea.name', 'FodderCropCultivation.keep_private', 'FodderCropCultivation.exclude']},
    {tableName: 'Fodder Crop Type', dbTableName: 'fodder_crop_type', filters: ['User.id', 'FodderCropType.uploaded_at', 'FodderCropType.name', 'FodderCropType.annual_dry_matter_per_hectare', 'FodderCropType.content_metabolisable_energy', 'FodderCropType.content_crude_protein', 'FodderCropType.replaced_by_id']},
    {tableName: 'Income Activity', dbTableName: 'income_activity', filters: ['User.id', 'IncomeActivity.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'IncomeActivityType.description', 'IncomeActivityCategory.description', 'IncomeActivity.percent_of_hh_income', 'IncomeActivity.keep_private', 'IncomeActivity.exclude']},
    {tableName: 'Income Activity Type', dbTableName: 'income_activity_type', filters: ['User.id', 'IncomeActivityType.uploaded_at', 'IncomeActivityType.description', 'IncomeActivityCategory.description', 'IncomeActivityType.keep_private', 'IncomeActivityType.exclude']},
    {tableName: 'Intervention', dbTableName: 'intervention', filters: ['User.id', 'Intervention.uploaded_at', 'Intervention.description']},
    {tableName: 'Labour Activity', dbTableName: 'labour_activity', filters: ['User.id', 'LabourActivity.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'LabourActivity.description', 'LabourActivity.daily_rate_male', 'LabourActivity.daily_rate_female', 'LabourActivity.keep_private', 'LabourActivity.exclude']},
    {tableName: 'Livestock Holding', dbTableName: 'livestock_holding', filters: ['User.id', 'LivestockHolding.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'AnimalType.description', 'LivestockHolding.headcount', 'LivestockHolding.average_weight', 'LivestockHolding.keep_private', 'LivestockHolding.exclude']},
    {tableName: 'Livestock Sale', dbTableName: 'livestock_sale', filters: ['User.id', 'LivestockSale.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'AnimalSpecies.description', 'Gender.description', 'LivestockSale.number_sold', 'LivestockSale.approximate_weight', 'LivestockSale.keep_private', 'LivestockSale.exclude']},
    {tableName: 'Livestock Sale Category', dbTableName: 'livestock_sale_category', filters: ['User.id', 'LivestockSaleCategory.uploaded_at', 'AnimalSpecies.description', 'Gender.description']},
    {tableName: 'Purchased Feed', dbTableName: 'purchased_feed', filters: ['User.id', 'PurchasedFeed.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'PurchasedFeedType.name', 'PurchasedFeed.quantity_purchased', 'UnitMassWeight.name', 'PurchasedFeed.purchases_per_year', 'PurchasedFeed.unit_price', 'Currency.name', 'PurchasedFeed.keep_private', 'PurchasedFeed.exclude']},
    {tableName: 'Purchased Feed Type', dbTableName: 'purchased_feed_type', filters: ['User.id', 'PurchasedFeedType.uploaded_at', 'PurchasedFeedType.name', 'PurchasedFeedType.percent_dry_matter', 'PurchasedFeedType.content_metabolisable_energy', 'PurchasedFeedType.content_crude_protein']},
    {tableName: 'Project', dbTableName: 'project', filters: ['User.id', 'ProjectView.title', 'ProjectView.description', 'ProjectView.start_date', 'ProjectView.keep_private', 'ProjectView.can_exclude']},
    {tableName: 'Respondent', dbTableName: 'respondent', filters: ['User.id', 'Respondent.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Gender.description', 'LandholdingCategory.description', 'Respondent.head_of_household_occupation', 'Respondent.diet_percent_grazing', 'Respondent.diet_percent_collected_fodder', 'Respondent.keep_private', 'Respondent.exclude']},
    {tableName: 'Respondent Monthly Statistics', dbTableName: 'respondent_monthly_statistics', filters: ['User.id', 'RespondentMonthlyStatistics.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'Month.name', 'RespondentMonthlyStatistics.milk_average_yield', 'RespondentMonthlyStatistics.milk_average_price_litre', 'RespondentMonthlyStatistics.milk_retained_for_household', 'RespondentMonthlyStatistics.market_price_cattle', 'RespondentMonthlyStatistics.market_price_sheep', 'RespondentMonthlyStatistics.market_price_goat', 'RepsondentMonthlyStatistics.keep_private']},
    {tableName: 'Season', dbTableName: 'season', filters: ['User.id', 'Season.uploaded_at', 'Season.name']},
    {tableName: 'Site', dbTableName: 'site', filters: ['User.id', 'SiteView.uploaded_at', 'ProjectView.id', 'SiteView.name', 'SiteView.major_region', 'Country.name', 'SiteView.keep_private', 'SiteView.exclude']},
    {tableName: 'Unit Area', dbTableName: 'unit_area', filters: ['User.id', 'UnitArea.uploaded_at', 'UnitArea.name', 'UnitArea.conversion_ha']},
    {tableName: 'Unit Mass/Weight', dbTableName: 'unit_mass_weight', filters: ['User.id', 'UnitMassWeight.uploaded_at', 'UnitMassWeight.name', 'UnitMassWeight.conversion_kg']},
    {tableName: 'Decision Making By Household', dbTableName: 'decision_making_by_household', filters: ['User.id', 'DecisionMakingByHousehold.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'Decision.id', 'GenderGroup.description', 'DecisionMakingByHousehold.keep_private', 'DecisionMakingByHousehold.exclude']},
    {tableName: 'Feed Labor Division', dbTableName: 'feed_labor_division', filters: ['User.id', 'FeedLaborDivision.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'FeedLaborType.id', 'LaborDivisionGroup.description', 'FeedLaborDivision.keep_private', 'FeedLaborDivision.exclude']},
    {tableName: 'Women Income Activity', dbTableName: 'womens_income_activity', filters: ['User.id', 'WomensIncomeActivity.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'WomensIncomeActivity.pct_womens_income', 'IncomeActivityType.description', 'WomensIncomeActivity.keep_private', 'WomensIncomeActivity.exclude']},
    {tableName: 'Coop Membership', dbTableName: 'coop_membership', filters: ['User.id', 'CoopMembership.uploaded_at', 'ProjectView.id', 'SiteView.id', 'FocusGroupView.id', 'Respondent.id', 'CoopMembership.name_free_entry', 'CoopMembership.membership_count_male', 'CoopMembership.membership_count_female', 'CoopMembership.keep_private', 'CoopMembership.exclude']},
];

var baseTableHeaders = ['ID', 'U'];

var tableList = [
    {label: 'Core Group', tables: [
        {tableName: 'Project', dbTableName: 'project', tableHeaders: ['Project Title', 'Project Description', 'Start Date']},
        {tableName: 'Site', dbTableName: 'site', tableHeaders: ['P', 'Name', 'Major Region', 'Country']},
        {tableName: 'Focus Group', dbTableName: 'focus_group', tableHeaders: ['P', 'S', 'Community', 'Venue', 'Meeting Date/Time']}
    ]},
    {label: 'Feast Assessment', tables: [
		{tableName: 'Core Context Attribute Score', dbTableName: 'core_context_attribute_score', tableHeaders: ['Core Context Attribute Type', 'Prompt', 'Techfit Scale Number', 'Techfit Assessment ID']},
        {tableName: 'Crop Cultivation', dbTableName: 'crop_cultivation', tableHeaders: ['P', 'S', 'F', 'R', 'Crop Type', 'Cultivated Area', 'Area Unit', 'Annual Yield', 'Mass/Weight Unit']},
        {tableName: 'Fodder Crop Cultivation', dbTableName: 'fodder_crop_cultivation', tableHeaders: ['P', 'S', 'F', 'R', 'Fodder Crop Type', 'Cultivated Area', 'Area Unit']},
        {tableName: 'Feed Source Availability', dbTableName: 'feed_source_availability', tableHeaders: ['P', 'S', 'F', 'R', 'Feed Source', 'Month', 'Contribution']},
        {tableName: 'Livestock Holding', dbTableName: 'livestock_holding', tableHeaders: ['P', 'S', 'F', 'R', 'Animal Type', 'Headcount', 'Average Weight']},
		{tableName: 'Purchased Feed', dbTableName: 'purchased_feed', tableHeaders: ['P', 'S', 'F', 'R', 'Type', 'Quantity Purchased', 'Weight/Mass Unit', 'Purchases / Year', 'Unit Price', 'Currency']},
		{tableName: 'Respondent', dbTableName: 'respondent', tableHeaders: ['P', 'S', 'F', 'Gender', 'Landholding Category', 'Head of Household Occupation', 'Diet % Grazing', 'Diet % Collected Fodder']},
    ]},
    {label: 'Gendered', tables: [
        {tableName: 'Decision Making By Household', dbTableName: 'decision_making_by_household', tableHeaders: ['P', 'S', 'F', 'R', 'Decision', 'Gender Group']},
        {tableName: 'Feed Labor Division', dbTableName: 'feed_labor_division', tableHeaders: ['P', 'S', 'F', 'R', 'Feed Labor Type', 'Labor Division Group']},
        {tableName: 'Women Income Activity', dbTableName: 'womens_income_activity', tableHeaders: ['P', 'S', 'F', 'R', 'Income Activity Type', 'Women Income']},
        {tableName: 'Coop Membership', dbTableName: 'coop_membership', tableHeaders: ['P', 'S', 'F', 'R', 'Name', 'Male Count', 'Female Count']},
    ]},
    {label: 'Lookup', tables: [
        {tableName: 'Animal Category', dbTableName: 'animal_category', tableHeaders: ['Species', 'Category']},
        {tableName: 'Animal Species', dbTableName: 'animal_species', tableHeaders: ['Species']},
        {tableName: 'Animal Type', dbTableName: 'animal_type', tableHeaders: ['Species', 'Category', 'Type', 'Lactating', 'Dairy', 'Lower Weight Limit', 'Upper Weight Limit']},
        {tableName: 'Community Type', dbTableName: 'community_type', tableHeaders: ['Type']},
        {tableName: 'Crop Type', dbTableName: 'crop_type', tableHeaders: ['Type', 'Harvest Index', '% Dry Matter', 'Metabolisable Energy Content', 'Crude Protein Content']},
        {tableName: 'Feed Source', dbTableName: 'feed_source', tableHeaders: ['Site ID', 'Description']},
        {tableName: 'Focus Group Monthly Statistics', dbTableName: 'focus_group_monthly_statistics', tableHeaders: ['P', 'S', 'F', 'Month', 'Scale (0-5)']},
        {tableName: 'Fodder Crop Type', dbTableName: 'fodder_crop_type', tableHeaders: ['Type', 'Annual Dry Matter / Hectare', 'Metabolisable Energy Content', 'Crude Protein Content']},
        {tableName: 'Income Activity', dbTableName: 'income_activity', tableHeaders: ['P', 'S', 'F', 'R', 'Type', 'Category', '% of Household Income']},
        {tableName: 'Income Activity Type', dbTableName: 'income_activity_type', tableHeaders: ['Type', 'Category']},
        {tableName: 'Intervention', dbTableName: 'intervention', tableHeaders: ['Description']},
        {tableName: 'Labour Activity', dbTableName: 'labour_activity', tableHeaders: ['P', 'S', 'F', 'Description', 'Daily Rate - Male', 'Daily Rate - Female']},
        {tableName: 'Livestock Sale', dbTableName: 'livestock_sale', tableHeaders: ['P', 'S', 'F', 'R', 'Species', 'Gender', 'Number Sold', 'Approximate Weight']},
        {tableName: 'Livestock Sale Category', dbTableName: 'livestock_sale_category', tableHeaders: ['Species', 'Gender']},
        {tableName: 'Purchased Feed Type', dbTableName: 'purchased_feed_type', tableHeaders: ['Type', '% Dry Matter', 'Metabolisable Energy Content', 'Crude Protein Content']},
        {tableName: 'Respondent Monthly Statistics', dbTableName: 'respondent_monthly_statistics', tableHeaders: ['P', 'S', 'F', 'R', 'Month', 'Milk - Avg. Yield', 'Milk - Avg. Price / Litre', 'Milk - Retained For Household Use', 'Market Price - Cattle', 'Market Price - Sheep', 'Market Price - Goat']},
        {tableName: 'Season', dbTableName: 'season', tableHeaders: ['Name']},
        {tableName: 'Unit Area', dbTableName: 'unit_area', tableHeaders: ['Name', 'Conversion - ha']},
        {tableName: 'Unit Mass/Weight', dbTableName: 'unit_mass_weight', tableHeaders: ['Name', 'Conversion - kg']},
    ]},
];

/**
 * Use instead of "concat" to preserve reference.
 * See @jcdude's answer: http://stackoverflow.com/questions/1374126/how-to-extend-an-existing-javascript-array-with-another-array
 */
Array.prototype.extend = function(other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {
        this.push(v)
    }, this);
};