import os
import random

import numpy as np
import tensorflow as tf

def load_alphabet():
    alpha_file = open('alphabet.txt', 'r')
    symbols = alpha_file.read()
    alpha_file.close()
    return symbols

alphabet = load_alphabet()


card_files = []
for dir_name, _, files in os.walk('cards'):
    for f in files:
        card_files.append(os.path.join(dir_name, f))

def random_card():
    f = open(random.choice(card_files), 'r')
    text = f.read()
    f.close()
    return text

def encode(symbol):
    return [1 if x == symbol else 0 for x in alphabet]

def encode_card(card):
    return np.array([encode(symbol) for symbol in card], dtype=np.float32)

def encode_input(card):
    encoded = encode_card(card)
    return np.insert(encoded, 0, np.zeros(len(alphabet)), axis=0)

def encode_output(card):
    encoded = encode_card(card)
    return np.append(encoded, [np.zeros(len(alphabet))], axis=0)


class Config:
    batch_size = 1
    num_steps = 1

    
class Model:
    def __init__(self, is_training, config):
        self.batch_size = batch_size = config.batch_size
        self.num_steps = num_steps = config.num_steps

        self._input_data = tf.placeholder(tf.float32, [batch_size, num_steps])
        self._targets = tf.placeholder(tf.float32, [batch_size, num_steps])

