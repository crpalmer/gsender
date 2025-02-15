import React from 'react';
import get from 'lodash/get';
import pubsub from 'pubsub-js';

import store from 'app/store';
import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import {
    WORKSPACE_MODE,
    ROTARY_MODE_FIRMWARE_SETTINGS,
    ROTARY_TOGGLE_MACRO,
    DEFAULT_FIRMWARE_SETTINGS,
} from 'app/constants';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';

export const updateWorkspaceMode = (mode = WORKSPACE_MODE.DEFAULT) => {
    const { DEFAULT, ROTARY } = WORKSPACE_MODE;
    const firmwareType = get(reduxStore.getState(), 'controller.type');
    const rotaryFirmwareSettings = store.get('workspace.rotaryAxis.firmwareSettings', ROTARY_MODE_FIRMWARE_SETTINGS);

    store.replace('workspace.mode', mode);

    switch (mode) {
    case DEFAULT: {
        const defaultFirmwareSettings = store.get('workspace.rotaryAxis.defaultFirmwareSettings', DEFAULT_FIRMWARE_SETTINGS);

        const defaultFirmwareSettingsArr = Object.entries(defaultFirmwareSettings).map(([key, value]) => `${key}=${value}`);

        controller.command('gcode', [...defaultFirmwareSettingsArr, '$$', ROTARY_TOGGLE_MACRO]);
        return;
    }

    case ROTARY: {
        // We only need to update the firmware settings on grbl machines
        if (firmwareType === 'Grbl') {
            // Convert to array to send to the controller, will look something like this: ["$101=26.667", ...]
            const rotaryFirmwareSettingsArr = Object.entries(rotaryFirmwareSettings).map(([key, value]) => `${key}=${value}`);

            Confirm({
                title: 'Enable Rotary Mode',
                cancelLabel: 'Cancel',
                confirmLabel: 'OK',
                content: (
                    <div style={{ textAlign: 'left', width: '90%', margin: 'auto', fontSize: '1.25rem' }}>
                        <p>Enabling rotary mode will perform the following actions:</p>

                        <ol>
                            <li style={{ marginBottom: '1rem' }}>Zero the Y-Axis in it&apos;s current position</li>
                            <li style={{ marginBottom: '1rem' }}>Turn soft and hard limits off, if they are on</li>
                            <li>
                                <span>Update the following firmware values:</span>

                                <ul style={{ marginTop: '0.5rem' }}>
                                    <li>$101 (Y-Axis travel resolution)</li>
                                    <li>$111 (Y-Axis maximum rate)</li>
                                </ul>
                            </li>
                        </ol>

                        <p>Please make sure you have switched over your wiring for the new setup.</p>
                    </div>
                ),
                onConfirm: () => {
                    // zero y and enable rotary
                    controller.command('gcode', ['G10 L20 P1 Y0', ...rotaryFirmwareSettingsArr, '$$', ROTARY_TOGGLE_MACRO]);

                    pubsub.publish('visualizer:updateposition', { y: 0 });

                    Toaster.pop({
                        msg: 'Rotary Mode Enabled',
                        type: TOASTER_INFO,
                    });
                },
                onClose: () => {
                    store.replace('workspace.mode', WORKSPACE_MODE.DEFAULT);
                }
            });
        }

        return;
    }

    default: {
        return;
    }
    }
};
