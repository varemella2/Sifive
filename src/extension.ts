import * as vscode from 'vscode';
import * as fs from 'fs';
import Ajv from 'Ajv';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.sifive-test.validateJson', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const fileName = document.fileName;
            const fileExtension = fileName.split('.').pop();

            if (fileExtension === 'json' || fileExtension === 'json5') {
                try {
                    const jsonContent = JSON.parse(document.getText());
                    const schema = {
                        "type": "object",
                        "properties": {
                            "Port0": { "type": "object" },
                            "Port1": { "type": "object" },
                            "Port2": { "type": "object" }
                        },
                        "required": ["Port0", "Port1", "Port2"]
                    };

                    const ajv = new Ajv();
                    const validate = ajv.compile(schema);
                    const valid = validate(jsonContent);

                    if (!valid) {
                        vscode.window.showErrorMessage('JSON is invalid: ' + validate.errors?.map(e => e.message).join(', '));
                    } else {
                        checkOverlaps(jsonContent);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Invalid JSON format');
                }
            }
        }
    });

    context.subscriptions.push(disposable);
}

function checkOverlaps(jsonContent: any) {
    const ports = Object.values(jsonContent);
    const ranges = ports.map((port: any) => ({
        start: port.baseAddress,
        end: port.baseAddress + port.sizeBytes
    }));

    for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
            if (ranges[i].end > ranges[j].start && ranges[i].start < ranges[j].end) {
                vscode.window.showInformationMessage(`Overlap detected between Port${i} and Port${j}`);
                return;
            }
        }
    }

    vscode.window.showInformationMessage('No overlaps detected');
}

export function deactivate() {}