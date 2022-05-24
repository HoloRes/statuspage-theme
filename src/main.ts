import './styles.css';

const BASE_URL = 'https://status.twilio.com/api/v2';
const URL_SUFFIX = '';

function get_time_tz(givenTime, timeZone) {
	let dateTime = luxon.DateTime.fromISO(givenTime, { zone: 'UTC' });

	if (timeZone === 'JST') {
		dateTime = dateTime.setZone('Asia/Tokyo');
	} else if (timeZone === 'UTC') {
		dateTime = dateTime.setZone('UTC');
	}

	return dateTime.toFormat('MMM d, HH:mm');
}

function get_component_header_class(status, header_class) {
	if (header_class !== 'red') {
		if (status === 'major_outage') {
			header_class = 'red';
		} else if (header_class !== 'orange') {
			if (
				status === 'partial_outage' ||
				status === 'degraded_performance'
			) {
				header_class = 'orange';
			} else if (header_class !== 'green') {
				header_class = 'green';
			}
		}
	}
	return header_class;
}

function get_incident_message(incident, message_body) {
	if (!incident || !message_body) {
		return message_body;
	}
	let product_string = '';
	incident.components.forEach((component, index) => {
		const product_name = component.name;
		if (index === incident.components.length - 1) {
			product_string = product_string.concat(product_name);
		} else if (incident.components.length === 2) {
			product_string = product_string.concat(product_name, ' and ');
		} else if (index === incident.components.length - 2) {
			product_string = product_string.concat(product_name, ', and ');
		} else {
			product_string = product_string.concat(product_name, ', ');
		}
	});

	if (product_string !== '') {
		message_body = `${message_body} Potentially impacted products: ${product_string}.`;
	}
	return message_body;
}

$(window).scroll(() => {
	if ($(window).scrollTop() > 0.2) {
		$('.own-custom-header').addClass('active');
	} else {
		$('.own-custom-header').removeClass('active');
	}
});

$(window).on('load', () => {
	if (navigator.userAgent.search('MSIE')) {
		$('body').addClass('ie');
	}
	const headerHeight = $('.own-custom-header').height();
	$('body').css('padding-top', headerHeight);

	$.getJSON(`${BASE_URL}/summary.json${URL_SUFFIX}`, (summaryData) => {
		let incidentHtml;
		let incidentUpdate;
		let componentHtml;
		let down_internal = 0;
		let down_public = 0;
		let down_tl = 0;
		const down_services = 0;
		let total_incidents = 0;
		let scheduled_count = 0;
		let componentUl;
		let i_components_bg_class;
		let p_components_bg_class;
		let tl_components_bg_class;
		let dot_class;
		let incident_header_bg_class;
		let reporting_text;
		const public_services_group = [
			'q7rx5pmcrbph', // PUBLIC
		];
		const tlteam_services_group = [
			'nbd9337b5pyb', // IKARI
			'fgkdnspqvxqs', // AUTHENTICATION SERVEr
			'5njnlmt1y5qx', // MISC
		];
		const asset_url = 'https://holores.s3.nl-ams.scw.cloud';
		const public_services = [
			'fhcnlhgpqslb', // Placeholder
		];
		const tl_services = [
			'9ktpxkrb6448', // Ikari
			'zscltpxb0m39', // Ikari DB
			'gbnnb129pq0d', // Authentication Server
			'cm2q8c53cn9m', // Authentication Server DB
			'y3myzsj38kxl', // Project Manager,
			'2qb6q533c25x', // Public Suggestions Page
		];

		// Page status
		if (summaryData.status.indicator === 'critical') {
			dot_class = 'red-dot';
		} else if (
			summaryData.status.indicator === 'major' ||
			summaryData.status.indicator === 'minor'
		) {
			dot_class = 'orange-dot';
		} else {
			dot_class = 'green-dot';
		}

		total_incidents = summaryData.incidents.length;

		$.each(summaryData.incidents, (incident_index, incident_value) => {
			if (
				incident_value.impact === 'none' &&
				incident_value.status === 'investigating'
			) {
				total_incidents -= 1;

				return true;
			}
			let i_count = 0;
			let tl_count = 0;
			let p_count = 0;
			$.each(incident_value.components, (ic_index, ic_value) => {
				const foundPublicIndex = public_services.indexOf(ic_value.id);
				const foundTlIndex = tl_services.indexOf(ic_value.id);
				if (foundPublicIndex !== -1) {
					p_components_bg_class = get_component_header_class(
						ic_value.status,
						p_components_bg_class,
					);
					if (p_count === 0) {
						down_public++;
						p_count++;
					}
				} else if (foundTlIndex !== -1) {
					tl_components_bg_class = get_component_header_class(
						ic_value.status,
						tl_components_bg_class,
					);
					if (tl_count === 0) {
						down_tl++;
						tl_count++;
					}
				} else {
					i_components_bg_class = get_component_header_class(
						ic_value.status,
						i_components_bg_class,
					);
					if (i_count === 0) {
						down_internal++;
						i_count++;
					}
				}
			});
		});

		if (down_internal === 0 && down_services === 0) {
			i_components_bg_class = 'green';

			$('#i_component_status_bar').html('All Systems Operational');
		} else if (down_internal === 0 && down_services > 0) {
			i_components_bg_class = 'green';
			md;
			reporting_text = `${down_services} SERVICE${
				down_services === 1 ? '' : 'S'
			}`;

			$('#i_component_status_bar').html(
				`${reporting_text} MAY BE IMPACTED`,
			);
		} else if (down_internal > 0 && down_services > 0) {
			reporting_text = `${down_internal} INCIDENT${
				down_internal === 1 ? '' : 'S'
			}, ${down_services} SERVICE${down_services === 1 ? '' : 'S'}`;

			$('#i_component_status_bar').html(
				`${reporting_text} MAY BE IMPACTED`,
			);
		} else {
			reporting_text = `${down_internal} INCIDENT${
				down_internal === 1 ? '' : 'S'
			}`;
			$('#i_component_status_bar').html(`${reporting_text} REPORTED`);
		}

		if (down_public === 0) {
			p_components_bg_class = 'green';

			$('#p_component_status_bar').html('All Systems Operational');
		} else {
			reporting_text = `${down_public} INCIDENT${
				down_public === 1 ? '' : 'S'
			}`;

			$('#p_component_status_bar').html(`${reporting_text} REPORTED`);
		}
		if (down_tl === 0) {
			tl_components_bg_class = 'green';

			$('#tl_component_status_bar').html('All Systems Operational');
		} else {
			reporting_text = `${down_tl} INCIDENT${down_tl === 1 ? '' : 'S'}`;

			$('#tl_component_status_bar').html(`${reporting_text} REPORTED`);
		}

		$('#i_component_status_bar').addClass(`bg-${i_components_bg_class}`);
		$('#p_component_status_bar').addClass(`bg-${p_components_bg_class}`);
		$('#tl_component_status_bar').addClass(`bg-${tl_components_bg_class}`);

		if (total_incidents === 0) {
			$('#page_status_bar').html(
				`<span class="${dot_class}"></span>All Systems Operational`,
			);
			$('#status_based_txt').html(
				'Current Information on Service Availability.',
			);
		} else {
			$('#page_status_bar').html(
				`<span class="${dot_class}"></span>${total_incidents} INCIDENT${
					total_incidents === 1 ? '' : 'S'
				} REPORTED`,
			);
			$('#status_based_txt').html(
				'Current Information on Service Availability.',
			);
		}

		// Header.html is used as path for development
		if (
			window.location.pathname !== '/' &&
			window.location.pathname !== '/header.html'
		) {
			url_path = window.location.pathname;
			if (url_path.substring(1, 10) === 'incidents') {
				incident_id = url_path.substring(11, url_path.length);
				$.getJSON(
					`${BASE_URL}/incidents.json${URL_SUFFIX}`,
					(allIncidents) => {
						$.each(allIncidents.incidents, (i_index, i_value) => {
							const componentsArray = [];
							let affected_component;
							let affected_class;
							if (i_value.id === incident_id) {
								$('.components-affected').html(
									'<div class="components-affected-wrapper"><span  class="color-gray-300 text-xl">This incident affected: </span></div>',
								);
								if (
									i_value.impact === 'none' &&
									i_value.status === 'investigating'
								) {
									i_value.components.forEach((component) => {
										$(
											'.components-affected-wrapper',
										).append(
											`<span>${component.name}</span>`,
										);
									});
								}
								$.each(
									i_value.incident_updates,
									(iu_index, iu_value) => {
										if (
											iu_value.affected_components !==
											null
										) {
											$.each(
												iu_value.affected_components,
												(ac_index, ac_value) => {
													if (
														ac_value.new_status !==
															'operational' &&
														!componentsArray.includes(
															ac_value.name,
														)
													) {
														if (
															ac_value.new_status ===
															'major_outage'
														) {
															affected_class =
																'red-dot-own';
														} else if (
															ac_value.new_status ===
																'partial_outage' ||
															ac_value.new_status ===
																'degraded_performance'
														) {
															affected_class =
																'orange-dot-own';
														} else if (
															ac_value.new_status ===
															'under_maintenance'
														) {
															affected_class =
																'yellow-dot-own';
														} else {
															affected_class =
																'green-dot-own';
														}
														comp_name =
															ac_value.name.substring(
																ac_value.name.indexOf(
																	'-',
																) + 1,
															);
														$(
															'.components-affected-wrapper',
														).append(
															`<span class="${affected_class} dot-before text-lg text-blue-500">${comp_name}</span>`,
														);
														componentsArray.push(
															ac_value.name,
														);
														affected_component =
															ac_value.name;
													}
												},
											);
										}
									},
								);
							}
						});
					},
				);
			}

			setTimeout(() => {
				$('.loader-wrapper').fadeOut();
			}, 500);

			$('#theStatus').hide();
			$('.main-page').hide();
			$('#above_footer').hide();
		} else {
			summaryData.scheduled_maintenances = $.grep(
				summaryData.scheduled_maintenances,
				(sm_value, sm_index) => {
					if (sm_value.status === 'in_progress') {
						summaryData.incidents.push(sm_value);
						return false;
					}
					return true;
				},
			);

			// for incidents
			$.each(summaryData.incidents, (index, value) => {
				if (value.impact === 'critical') {
					incident_header_bg_class = 'bg-red';
				} else if (
					value.impact === 'major' ||
					value.impact === 'minor'
				) {
					incident_header_bg_class = 'bg-orange';
				} else if (value.impact === 'maintenance') {
					incident_header_bg_class = 'bg-blue';
				} else {
					incident_header_bg_class = 'bg-green';
				}

				incidentHtml = `<div class="col-md-12 class-to-catch"> \
              <div class="box-wrapper"> \
                <div class="box-heading ${incident_header_bg_class} text-white py-3 px-4"> \
                  <div class="flex flex-wrap justify-between items-center"> \
                    <div class="flex flex-col"><a class="text-white" href="/incidents/${value.id}">${value.name}</a></div> \
                  <div class="small-btn-wrapper flex space-x-2" id="services_${value.id}"> \
                  </div> \
                </div> \
              </div> \
              <ul class="list-unstyled status-list p-4" id="${value.id}"></ul> \
              </div> \
            </div>`;
				if (value.impact === 'maintenance') {
					$('#maintenance_incident').append(incidentHtml);
				} else if (value.impact === 'critical') {
					$('#red_incident_container').append(incidentHtml);
				} else if (
					value.impact === 'none' &&
					value.status === 'investigating'
				) {
					const message_body = get_incident_message(
						value,
						value.incident_updates[0].body,
					);
					incidentHtml =
						'<div class="alert-box col-md-12 class-to-catch">' +
						'<div class="info-icon"><svg width="16px" height="16px" viewBox="0 0 16 16" <g id="Final" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="final" transform="translate(-216.000000, -363.000000)" fill="#282A2B"><g id="Interface-/-WarningIcon" transform="translate(224.000000, 371.000000) scale(-1, 1) rotate(-360.000000) translate(-224.000000, -371.000000) translate(212.000000, 359.000000)"><path d="M12,4 C16.418278,4 20,7.581722 20,12 C20,16.418278 16.418278,20 12,20 C7.581722,20 4,16.418278 4,12 C4,7.581722 7.581722,4 12,4 Z M12,14.6666667 C11.2636203,14.6666667 10.6666667,15.2636203 10.6666667,16 C10.6666667,16.7363797 11.2636203,17.3333333 12,17.3333333 C12.7363797,17.3333333 13.3333333,16.7363797 13.3333333,16 C13.3333333,15.2636203 12.7363797,14.6666667 12,14.6666667 Z M13,7 L11,7 L11,13 L13,13 L13,7 Z" id="WarningIcon"></path></g></g></g></svg></div>' +
						`<div class="alert-text">${message_body} ${get_time_tz(
							value.updated_at,
							'PST',
						)} PST </div></div>`;

					$('#green_alerted_container').append(incidentHtml);
				} else {
					$('#orange_incident_container').append(incidentHtml);
				}

				$.each(value.incident_updates, (iu_index, iu_value) => {
					const iu_status = iu_value.status.replace(/_/g, ' ');
					incidentUpdate = `<li> \
              <div class="status-details"> \
                <b>${iu_status}</b> \
                <span> - ${iu_value.body}</span> \
              </div> \
              <div class="status-upload-date text-uppercase"> \
                Posted: ${get_time_tz(iu_value.display_at, 'JST')} JST \
              </div> \
            </li>`;
					$(`#${iu_value.incident_id}`).append(incidentUpdate);
				});

				if (
					value.incident_updates[0] &&
					value.incident_updates[0].affected_components
				) {
					$.each(
						value.incident_updates[0].affected_components,
						(iuac_index, iuac_value) => {
							const affected_service = iuac_value.name.substring(
								iuac_value.name.indexOf('-') + 1,
							);
							const incidentUpdate_ac = `<div class="rounded-sm bg-opacity-20 bg-white w-auto py-1 px-2 uppercase text-xs">${affected_service}</div>`;
							$(`#services_${value.id}`).append(
								incidentUpdate_ac,
							);
						},
					);
				}
			});

			const containers = [
				'#red_incident_container',
				'#orange_incident_container',
				'#maintenance_incident',
				'#green_alerted_container',
			];
			const children = $(containers.join(',')).map(function () {
				return $(this).children().length;
			});
			const totalNumChildren = children
				.get()
				.reduce((total, count) => total + count);

			if (totalNumChildren === 0) {
				$('#component_top_hr').hide();
			} else {
				$('#above_footer').hide();
			}

			$.each(
				summaryData.components,
				(componentsIndex, componentsValue) => {
					if (
						componentsValue.group === true ||
						(componentsValue.group === false &&
							componentsValue.group_id === null)
					) {
						if (componentsValue.status === 'major_outage') {
							dot_class = 'red-dot-own';
						} else if (
							componentsValue.status === 'partial_outage' ||
							componentsValue.status === 'degraded_performance'
						) {
							dot_class = 'orange-dot-own';
						} else if (
							componentsValue.status === 'under_maintenance'
						) {
							dot_class = 'blue-dot-own';
						} else {
							dot_class = 'green-dot-own';
						}

						if (
							public_services_group.indexOf(
								componentsValue.id,
							) !== -1
						) {
							componentHtml = `<li class=""><div class="green-dot-own ${dot_class} dot-before outer-box-heading text-uppercase">${componentsValue.name}</div></li>`;

							$('#public_components').append(componentHtml);
							if (componentsValue.components) {
								componentUl = `<ul class="list-unstyled pl-4 inner-box-dot-wrapper pb-2 pt-3" id="${componentsValue.id}"></ul>`;

								$('#public_components li:last-child').append(
									componentUl,
								);
							}
						} else if (
							tlteam_services_group.indexOf(
								componentsValue.id,
							) !== -1
						) {
							componentHtml = `<li class=""><div class="green-dot-own ${dot_class} dot-before outer-box-heading text-uppercase">${componentsValue.name}</div></li>`;

							$('#tl_components').append(componentHtml);
							if (componentsValue.components) {
								componentUl = `<ul class="list-unstyled pl-4 inner-box-dot-wrapper pb-2 pt-3" id="${componentsValue.id}"></ul>`;

								$('#tl_components li:last-child').append(
									componentUl,
								);
							}
						} else {
							componentHtml = `<li class=""><div class="green-dot-own ${dot_class} dot-before outer-box-heading text-uppercase"> ${componentsValue.name}</div></li>`;

							$('#internal_components').append(componentHtml);
							if (componentsValue.components) {
								componentUl = `<ul class="list-unstyled pl-4 inner-box-dot-wrapper pb-2 pt-3" id="${componentsValue.id}"></ul>`;

								$('#internal_components li:last-child').append(
									componentUl,
								);
							}
						}
					}
				},
			);
			$.each(
				summaryData.components,
				(componentsIndex, componentsValue) => {
					if (componentsValue.group === false) {
						if (componentsValue.status === 'operational') {
							dot_class = 'green-dot-own';
						} else if (
							componentsValue.status === 'partial_outage' ||
							componentsValue.status === 'degraded_performance'
						) {
							dot_class = 'orange-dot-own';
						} else if (
							componentsValue.status === 'under_maintenance'
						) {
							dot_class = 'blue-dot-own';
						} else {
							dot_class = 'red-dot-own';
						}

						componentHtml = `<li class="dot-before ${dot_class}"> ${componentsValue.name} <span class="color-yellow" id="${componentsValue.id}"> </span></li>`;
						$(`#${componentsValue.group_id}`).append(componentHtml);

						if (dot_class === 'green-outline-dot-own') {
							$(`#${componentsValue.id}`).append(
								`&nbsp;&nbsp;<img src="${asset_url}/lightning.png" width="15"> May be impacted by a connectivity issue`,
							);
						}
					}
				},
			);

			$.each(summaryData.scheduled_maintenances, (sm_index, sm_value) => {
				scheduled_count++;
				const maintenance_start = get_time_tz(
					sm_value.scheduled_for,
					'JST',
				);
				const maintenance_end = get_time_tz(
					sm_value.scheduled_until,
					'JST',
				);

				incidentHtml = `<div class="box-wrapper mb-5"> \
                <div class="round-small-heading bg-blue color-white-own py-3 px-4"> \
                  <div class="heading-second pb-2"> ${sm_value.name}</div> \
                  <div class="heading-date">${maintenance_start} - ${maintenance_end} JST </div> \
                </div> \
                <div class="inc-box-wrapper"> \
                  <div class="inc-txt"> ${
						sm_value.incident_updates[0].body
					}</div> \
                  <div class="border-own my-4"></div> \
                  <div class="inc-list-heading pb-3"> MAINTENANCE PERIOD</div> \
                  <div class="row"> \
                    <div class="col-sm-7 col-12"> \
                      <ul class="list-unstyled inc-list-wrapper pl-4"> \
                        <li>JST: ${get_time_tz(
							sm_value.scheduled_for,
							'JST',
						)} - ${get_time_tz(
					sm_value.scheduled_until,
					'JST',
				)}</li> \
                        <li>UTC: ${get_time_tz(
							sm_value.scheduled_for,
							'UTC',
						)} - ${get_time_tz(
					sm_value.scheduled_until,
					'UTC',
				)} </li> \
                      </ul> \
                    </div> \
                    <div class="col-12 col-md-5 text-right d-flex align-items-end"> \
                      <div class="inc-list-time w-100">${get_time_tz(
							sm_value.incident_updates[0].display_at,
							'JST',
						)} JST</div> \
                    </div> \
                  </div> \
                </div> \
              </div>`;
				$('#scheduled_maintenances_div').append(incidentHtml);
			});
			setTimeout(() => {
				$('.loader-wrapper').fadeOut();
				$('[data-js-hook=show-updates-dropdown]').addClass(
					'btn btn-blue',
				);
			}, 500);
			$('.page-footer').hide();
			if (scheduled_count === 0) {
				$('#all_scheduled').hide();
			}
			$(window).scrollTop(0);
		}
	});
});
