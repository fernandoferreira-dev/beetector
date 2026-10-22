package com.example.beetector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.example.beetector.ui.theme.BeetectorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BeetectorTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    paglog(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }
}

@Composable
fun paglog(modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(
            text = "CERTO! CERTO! CERTO!",
            modifier = Modifier.padding(16.dp),
            text = "VOTE FERNANDO ENGENHEIRO!",
            modifier = Modifier.padding(16.dp),
        )
    }
}
/*
@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    BeetectorTheme {
        Greeting("Android")
    }
}
*/