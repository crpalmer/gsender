import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import map from 'lodash/map';

import { TOASTER_SUCCESS, Toaster } from 'app/lib/toaster/ToasterLib';
import store from 'app/store';
import controller from 'app/lib/controller';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import MacroVariableDropdown from 'app/components/MacroVariableDropdown';
import api from 'app/api';

import Fieldset from '../components/Fieldset';

import styles from '../index.styl';

const options = [
    'Ignore',
    'Manual',
    'Code',
    'Macro'
];

const ToolChange = () => {
    // State
    const [toolChangeOption, setToolChangeOption] = useState(store.get('workspace.toolChangeOption'));
    const [preHook, setPreHook] = useState(store.get('workspace.toolChangeHooks.preHook'));
    const [postHook, setPostHook] = useState(store.get('workspace.toolChangeHooks.postHook'));
    const [toolChangeMacro, setToolChangeMacro] = useState(store.get('workspace.toolChangeMacro'));
    const [macros, setMacros] = useState(null);

    // Handlers
    const handleToolChange = (selection) => setToolChangeOption(selection.value);
    const handlePreHookChange = (e) => setPreHook(e.target.value);
    const handlePostHookChange = (e) => setPostHook(e.target.value);
    const handleToolChangeMacro = (selection) => setToolChangeMacro(selection.value);
    const preHookRef = useRef();
    const postHookRef = useRef();
    const toolChangeMacroRef = useRef();

    const updateController = () => {
        const context = {
            toolChangeOption,
            postHook,
            preHook,
            toolChangeMacro
        };
        controller.command('toolchange:context', context);
    };

    const handleSaveCode = () => {
        store.set('workspace.toolChangeHooks.preHook', preHook);
        store.set('workspace.toolChangeHooks.postHook', postHook);
        updateController();
        Toaster.pop({
            msg: 'Saved tool change hooks',
            type: TOASTER_SUCCESS,
            icon: 'fa-check'
        });
    };

    useEffect(() => {
        store.set('workspace.toolChangeOption', toolChangeOption);
        updateController();
    }, [toolChangeOption]);

    // Macros
    const getCurrentMacro = () => {
        if (macros != null) {
            for (const macro of macros) {
                if (macro.id === toolChangeMacro) {
                    return macro.name;
                }
            }
        }
        return '';
    };

    const getMacros = async () => {
        const res = await api.macros.fetch();
        const { records: macros } = res.body;
        setMacros(macros);
    };

    if (toolChangeOption === 'Macro' && macros == null) {
        getMacros();
    }

    useEffect(() => {
        store.set('workspace.toolChangeMacro', toolChangeMacro);
        updateController();
    }, [toolChangeMacro]);

    return (
        <Fieldset legend="Tool Change" className={styles.paddingBottom}>
            <small>Strategy to handle M6 tool change commands</small>
            <div className={styles.addMargin}>
                <Select
                    backspaceRemoves={false}
                    className="sm"
                    clearable={false}
                    menuContainerStyle={{ zIndex: 5 }}
                    name="toolchangeoption"
                    onChange={handleToolChange}
                    options={map(options, (value) => ({
                        value: value,
                        label: value
                    }))}
                    value={{ label: toolChangeOption }}
                />
            </div>
            {
                toolChangeOption === 'Code' && (
                    <div>
                        <div className={styles.spreadRow}>
                            <MacroVariableDropdown textarea={preHookRef} label="Before change code"/>
                        </div>
                        <textarea
                            rows="9"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="preHook"
                            value={preHook}
                            onChange={handlePreHookChange}
                            ref={preHookRef}
                        />
                        <br />
                        <div className={styles.spreadRow}>
                            <MacroVariableDropdown textarea={postHookRef} label="After change code"/>
                        </div>
                        <textarea
                            rows="9"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="postHook"
                            value={postHook}
                            onChange={handlePostHookChange}
                            ref={postHookRef}
                        />
                        <FunctionButton primary onClick={handleSaveCode}>Save G-Code</FunctionButton>
                    </div>
                )
            }
            {
                toolChangeOption === 'Macro' && (
                    <div>
                        <small>Select the macro to execute</small>
                        <div className={styles.addMargin}>
                            <Select
                                backspaceRemoves={false}
                                className="sm"
                                clearable={false}
                                menuContainerStyle={{ zIndex: 5 }}
                                name="toolchangemacro"
                                onChange={handleToolChangeMacro}
                                options={macros != null && macros.map(macro => ({
                                    label: macro.name,
                                    value: macro.id
                                }))}
                                value={{ label: getCurrentMacro() }}
                                ref={toolChangeMacroRef}
                            />
                        </div>
                    </div>
                )
            }
        </Fieldset>
    );
};

export default ToolChange;
